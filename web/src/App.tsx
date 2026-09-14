import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatAmount, parseAmount, parseViewingKey, type TokenInfo, type ViewingKeyExport } from 'cft-demo-contract';
import { NETWORKS, applyNetworkId, type NetworkConfig, type NetworkKey } from './lib/config';
import {
  connectWallet,
  detectWallets,
  dustBalance,
  walletDisplayName,
  type ConnectedWallet,
  type DetectedWallet,
} from './lib/wallet';
import { observeAccount, observeTransaction, type KeyRing, type ObservedRow } from './lib/observe';
import { NotePrivateState } from 'cft-demo-contract';
import { NoteClient, deployNote, detectModel, joinNote, loadOrCreateNoteIdentity, makeNoteProviders, saveNoteIdentity } from './lib/note';
import { NotePanels } from './NotePanels';
import {
  CftClient,
  accountIdOf,
  deploy,
  join,
  loadOrCreateIdentity,
  makeProviders,
  saveIdentity,
  type ProvingMode,
  type Balances,
  type Inspection,
} from './lib/cft';

type LogLine = { t: string; msg: string; kind: 'info' | 'ok' | 'err' };

const short = (s: string, n = 10) => (s.length > 2 * n ? `${s.slice(0, n)}…${s.slice(-n)}` : s);

/** Ledger error codes seen in practice, translated. The raw text is kept. */
const explainError = (raw: string): string => {
  if (/Custom error: 170/.test(raw)) {
    return (
      `${raw}\n→ The node rejected the DUST fee proof that the wallet attached (ledger error 170, InvalidDustSpendProof). ` +
      'The contract proof was fine. Usual causes: the wallet\'s DUST state is stale (open the wallet, let it resync, retry), ' +
      'or the wallet/proof server proves against a different ledger version than the network. ' +
      'If it persists, reload, choose "Proof server" in panel 1 with the local Docker prover, and reconnect.'
    );
  }
  if (/exhaust the block limits/.test(raw)) return `${raw}\n→ The transaction is over the per-block write budget (too many circuits in one deploy).`;
  return raw;
};

const SOURCE_LABEL: Record<string, string> = {
  cache: 'from wallet cache',
  zero: '',
  memos: 'from memos',
  candidate: 'verified (own move or supply reconciliation)',
  recovered: 'recovered from ciphertext',
  unknown: 'unknown',
};

export default function App() {
  // ── connection ────────────────────────────────────────────────────────────
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [walletSearchDone, setWalletSearchDone] = useState(false);
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const [walletId, setWalletId] = useState('');
  const [networkKey, setNetworkKey] = useState<NetworkKey>('preview');
  const network: NetworkConfig = NETWORKS[networkKey];
  const [proofServer, setProofServer] = useState(network.defaultProofServer);
  const [proving, setProving] = useState<ProvingMode>('server');
  const [wallet, setWallet] = useState<ConnectedWallet | undefined>();
  const [dust, setDust] = useState<{ balance: bigint; cap: bigint } | undefined>();

  // ── contract ──────────────────────────────────────────────────────────────
  const [contractAddress, setContractAddress] = useState(() => localStorage.getItem('cft-demo/last-contract') ?? '');
  const [client, setClient] = useState<CftClient | undefined>();
  const [noteClient, setNoteClient] = useState<NoteClient | undefined>();
  const [model, setModel] = useState<'cft' | 'note'>('cft');
  const [lastTxHash, setLastTxHash] = useState<string | undefined>();
  const [refreshTick, setRefreshTick] = useState(0);
  const [token, setToken] = useState<TokenInfo | undefined>();
  const [balances, setBalances] = useState<Balances | undefined>();
  const [deployName, setDeployName] = useState('Confidential Dollar');
  const [deploySymbol, setDeploySymbol] = useState('cUSD');
  const [deployDecimals, setDeployDecimals] = useState('2');

  // ── forms ─────────────────────────────────────────────────────────────────
  const [knownBalance, setKnownBalance] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [freezeTarget, setFreezeTarget] = useState('');
  const [importKey, setImportKey] = useState('');
  const [escrowTarget, setEscrowTarget] = useState('');
  const [storedKeys, setStoredKeys] = useState<ViewingKeyExport[]>([]);
  const [viewerKey, setViewerKey] = useState('');
  const [viewerClaim, setViewerClaim] = useState('');
  const [inspection, setInspection] = useState<Inspection | undefined>();
  const [inspectionVk, setInspectionVk] = useState<ViewingKeyExport | undefined>();
  const [seizeTo, setSeizeTo] = useState('');

  // ── observer ("what the chain sees") ──────────────────────────────────────
  const [obsTab, setObsTab] = useState<'tx' | 'account'>('tx');
  const [obsHash, setObsHash] = useState('');
  const [obsAccount, setObsAccount] = useState('');
  const [obsRows, setObsRows] = useState<ObservedRow[] | undefined>();
  const [obsTitle, setObsTitle] = useState('');

  const [busy, setBusy] = useState<string | undefined>();
  const [lastError, setLastError] = useState<string | undefined>();
  const [log, setLog] = useState<LogLine[]>([]);

  const say = useCallback((msg: string, kind: LogLine['kind'] = 'info') => {
    setLog((l) => [{ t: new Date().toLocaleTimeString(), msg, kind }, ...l].slice(0, 200));
  }, []);

  useEffect(() => {
    let tries = 0;
    const poll = setInterval(() => {
      const found = detectWallets();
      if (found.length) {
        setWallets(found);
        setWalletId((id) => id || found[0].id);
        setWalletSearchDone(true);
        clearInterval(poll);
      } else if (++tries > 40) {
        setWalletSearchDone(true);
        clearInterval(poll);
      }
    }, 500);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => setProofServer(network.defaultProofServer), [network]);

  const decimals = token?.decimals ?? Number(deployDecimals || 0);
  const symbol = token?.symbol ?? '';
  const fmt = (v: bigint | undefined) => (v === undefined ? 'unknown' : formatAmount(v, decimals));
  const isIssuer = !!client && !!token && token.issuerAccountId === client.accountId;
  const identityId = client ? client.accountId : wallet ? accountIdOf(loadOrCreateIdentity(wallet.unshieldedAddress)) : undefined;

  const run = async <T,>(label: string, fn: () => Promise<T>, after?: (r: T) => void | Promise<void>) => {
    if (busy) return;
    setBusy(label);
    setLastError(undefined);
    say(`${label}…`);
    try {
      const r = await fn();
      if (after) await after(r);
      say(`${label}: done`, 'ok');
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const msg = explainError(raw);
      setLastError(`${label}: ${msg}`);
      say(`${label}: ${msg}`, 'err');
    } finally {
      setBusy(undefined);
    }
  };

  const refresh = useCallback(
    async (c: CftClient | undefined = client) => {
      if (!c) return;
      const t = await c.token();
      setToken(t);
      setStoredKeys(await c.storedViewingKeys().catch(() => []));
      try {
        setBalances(await c.balances());
      } catch (e) {
        say(`balance sync: ${e instanceof Error ? e.message : String(e)}`, 'err');
      }
    },
    [client, say],
  );

  const onConnect = () =>
    run('Connect wallet', async () => {
      const w = wallets.find((x) => x.id === walletId);
      if (!w) throw new Error('no wallet selected');
      applyNetworkId(network.networkId);
      const connected = await connectWallet(w, network.networkId);
      setWallet(connected);
      setProving(connected.canProveInWallet ? 'wallet' : 'server');
      setDust(await dustBalance(connected));
      const id = loadOrCreateIdentity(connected.unshieldedAddress);
      say(`connected ${connected.name} · ${short(connected.unshieldedAddress, 12)} · CFT accountId ${short(accountIdOf(id))}`);
    });

  const attach = async (c: CftClient) => {
    if (wallet) saveIdentity(wallet.unshieldedAddress, c.identity);
    setClient(c);
    setBalances(undefined);
    localStorage.setItem('cft-demo/last-contract', c.address);
    setContractAddress(c.address);
    await refresh(c);
  };

  const attachNote = async (c: NoteClient) => {
    if (wallet) saveNoteIdentity(wallet.unshieldedAddress, c.identity);
    setClient(undefined);
    setBalances(undefined);
    setNoteClient(c);
    localStorage.setItem('cft-demo/last-contract', c.address);
    setContractAddress(c.address);
    setRefreshTick((t) => t + 1);
  };

  const onDeploy = () =>
    run('Deploy token', async () => {
      if (!wallet) throw new Error('connect a wallet first');
      if (model === 'note') {
        let identity = loadOrCreateNoteIdentity(wallet.unshieldedAddress);
        if (!identity.roles) {
          // The deployer holds issuer, authority, audit and supply roles.
          identity = NotePrivateState.fromSecrets(identity.secretKeyHex, identity.encSecretHex, NotePrivateState.generate(true).roles);
          saveNoteIdentity(wallet.unshieldedAddress, identity);
        }
        const providers = await makeNoteProviders(wallet, network, proving, proofServer);
        const deployed = await deployNote(providers, identity);
        say(`deployed note token at ${deployed.deployTxData.public.contractAddress}`, 'ok');
        await attachNote(await NoteClient.attach(providers, deployed, identity));
        return;
      }
      const identity = loadOrCreateIdentity(wallet.unshieldedAddress);
      const providers = await makeProviders(wallet, network, proving, proofServer);
      const deployed = await deploy(providers, identity, deployName, deploySymbol, BigInt(deployDecimals));
      say(`deployed at ${deployed.deployTxData.public.contractAddress}`, 'ok');
      setNoteClient(undefined);
      await attach(await CftClient.attach(providers, deployed, identity));
    });

  const onJoin = () =>
    run('Join token', async () => {
      if (!wallet) throw new Error('connect a wallet first');
      const detected = await detectModel(network, contractAddress);
      if (detected === 'unknown') throw new Error('that address is not a CFT demo contract (neither account nor note model)');
      setModel(detected);
      if (detected === 'note') {
        const identity = loadOrCreateNoteIdentity(wallet.unshieldedAddress);
        const providers = await makeNoteProviders(wallet, network, proving, proofServer);
        const found = await joinNote(providers, contractAddress.trim(), identity);
        await attachNote(await NoteClient.attach(providers, found, identity));
        return;
      }
      setNoteClient(undefined);
      const identity = loadOrCreateIdentity(wallet.unshieldedAddress);
      const providers = await makeProviders(wallet, network, proving, proofServer);
      const found = await join(providers, contractAddress.trim(), identity);
      await attach(await CftClient.attach(providers, found, identity));
    });

  const tx = (label: string, fn: (c: CftClient) => Promise<{ txId: string; blockHeight: number }>) =>
    run(label, async () => {
      if (!client) throw new Error('join a token first');
      const r = await fn(client);
      say(`${label}: tx ${short(r.txId, 8)} in block ${r.blockHeight}`, 'ok');
      setObsHash(r.txId);
      setLastTxHash(r.txId);
      setObsTab('tx');
      await refresh();
      await observe('tx', r.txId).catch(() => undefined);
    });

  const txNote = (label: string, fn: () => Promise<{ txId: string; blockHeight: number }>) =>
    run(label, async () => {
      const r = await fn();
      say(`${label}: tx ${short(r.txId, 8)} in block ${r.blockHeight}`, 'ok');
      setLastTxHash(r.txId);
      setRefreshTick((t) => t + 1);
    });

  const claimed = useMemo(() => {
    try {
      return viewerClaim ? parseAmount(viewerClaim, decimals) : undefined;
    } catch {
      return undefined;
    }
  }, [viewerClaim, decimals]);

  const keyRing = (): KeyRing => {
    const keys: Record<string, string> = {};
    const names: Record<string, string> = {};
    if (client) {
      keys[client.accountId] = client.viewingKey().viewingKey;
      names[client.accountId] = 'you';
    }
    for (const k of storedKeys) keys[k.accountId] = k.viewingKey;
    if (inspectionVk) keys[inspectionVk.accountId] = inspectionVk.viewingKey;
    if (token) names[token.issuerAccountId] = names[token.issuerAccountId] ?? 'issuer';
    return { keys, names };
  };

  const observe = async (tab: 'tx' | 'account', value: string) => {
    if (!client || !token) throw new Error('join a token first');
    const ledger = await client.ledger();
    if (tab === 'tx') {
      const r = await observeTransaction(network.indexer, value.trim(), ledger, client.address, token.decimals, token.symbol, keyRing());
      setObsRows(r.rows);
      setObsTitle(`transaction ${short(r.hash, 8)}`);
    } else {
      const id = (value.trim() || client.accountId).toLowerCase();
      setObsRows(observeAccount(ledger, id, token.decimals, token.symbol, keyRing(), inspectionVk));
      setObsTitle(`account ${short(id, 8)}`);
    }
  };

  const seizeSelf = !!inspection && !!client && inspection.view.accountId === (seizeTo.trim().toLowerCase() || client.accountId);

  const onInspect = () =>
    run('Inspect with viewing key', async () => {
      if (!client) throw new Error('join a token first');
      const vk = parseViewingKey(viewerKey);
      const r = await client.inspect(vk, claimed);
      setInspection(r);
      setInspectionVk(vk);
    });

  /** Issuer: open an account's on-chain escrow with the compliance key, then inspect it. */
  const onOpenEscrow = (accountId: string) =>
    run('Open escrowed viewing key', async () => {
      if (!client) throw new Error('join a token first');
      const vk = await client.escrowedViewingKey(accountId);
      setViewerKey(JSON.stringify(vk));
      setViewerClaim('');
      setStoredKeys(await client.storedViewingKeys());
      const r = await client.inspect(vk);
      setInspection(r);
      setInspectionVk(vk);
      say(`opened ${short(vk.accountId, 8)}'s viewing key from the on-chain escrow; no cooperation from the holder was needed`, 'ok');
    });

  // ── step status for the guide ─────────────────────────────────────────────
  const steps: { label: string; done: boolean; hint: string }[] = [
    { label: 'Connect a wallet', done: !!wallet, hint: 'Panel 1. 1AM or Lace must be installed and unlocked on the chosen network.' },
    { label: 'Join or deploy a token', done: !!client, hint: 'Panel 2. Deploying makes you the issuer; joining needs an address from the issuer.' },
    {
      label: 'Register your account',
      done: !!balances?.registered,
      hint: 'Panel 3. Permissionless: publishes your encryption key so you can receive, and escrows your viewing key to the compliance key in the same proof.',
    },
    {
      label: 'Receive tokens',
      done: !!balances && ((balances.pending ?? 0n) > 0n || (balances.spendable ?? 0n) > 0n),
      hint: 'Issuer: mint to your own accountId in panel 5. Holder: send your accountId (panel 3) to the issuer.',
    },
    { label: 'Sweep pending → spendable', done: !!balances && (balances.spendable ?? 0n) > 0n, hint: 'Panel 3. Incoming credits wait in "pending" until you sweep them.' },
    { label: 'Transfer or burn', done: false, hint: 'Panel 4. Paste the recipient accountId; the amount stays hidden on-chain.' },
    { label: 'Audit with a viewing key', done: !!inspection, hint: 'Panel 6: issuer picks any registered account (its escrowed key opens automatically) or anyone pastes a disclosed key, then Inspect.' },
    {
      label: 'Issuer: freeze one account, or pause the whole token',
      done: false,
      hint: 'Panel 5. Freeze targets one accountId (needed before seize in panel 6); pause is the global kill switch for everyone.',
    },
  ];
  const noteSteps: { label: string; done: boolean; hint: string }[] = [
    { label: 'Connect a wallet', done: !!wallet, hint: 'Panel 1.' },
    { label: 'Deploy or join a note token', done: !!noteClient, hint: 'Panel 2, model "Note". The deployer holds the issuer, authority and audit roles.' },
    { label: 'Share your payment address', done: false, hint: 'Panel 3 "copy address": spend key + delivery key. There is no registration step and no public account.' },
    { label: 'Issuer mints notes', done: false, hint: 'Panel 5. Paste the recipient payment address. Notes appear in their panel 3 after a refresh.' },
    { label: 'Pay privately, burn', done: false, hint: 'Panel 4. One note per payment; change comes back as a new note.' },
    { label: 'Auditor reads the trail; authority freezes or seizes', done: false, hint: 'Panel 5: every note with owner and amount; freeze and seize act on a single note.' },
    { label: 'Compare public vs auditor view', done: false, hint: 'Panel 7 after any transaction.' },
  ];
  const activeSteps = noteClient ? noteSteps : steps;
  const nextStep = activeSteps.find((s) => !s.done);

  return (
    <div className="app">
      <header className="top">
        <h1>
          CFT Demo<span>OpenZeppelin ConfidentialFungibleToken on Midnight</span>
        </h1>
        <div className="row">
          {wallet ? (
            <>
              <span className="pill good">{wallet.name}</span>
              <span className="mono">{short(wallet.unshieldedAddress, 12)}</span>
              {dust && <span className="pill">DUST {formatAmount(dust.balance, 15)}</span>}
              <span className="pill">{network.label}</span>
              <span className="pill">{proving === 'wallet' ? `proving: in ${wallet.name}` : 'proving: proof server'}</span>
            </>
          ) : (
            <span className="pill">not connected</span>
          )}
          {busy && <span className="busy">⏳ {busy} (proving can take 20–40 s)</span>}
        </div>
      </header>

      {token?.paused && (
        <div className="banner paused">
          <b>Token paused.</b> The issuer has pulled the global kill switch: transfers, burns and mints are rejected for every account
          until it is unpaused. Registering, sweeping, freezing and seizing still work.
        </div>
      )}
      {lastError && (
        <div className="banner err">
          <b>Error.</b> {lastError}
          <button className="secondary small" onClick={() => setLastError(undefined)}>
            dismiss
          </button>
        </div>
      )}

      <div className="grid">
        {/* ── Guide ───────────────────────────────────────────────────────── */}
        <section className="panel wide guide">
          <h2>Start here</h2>
          {noteClient ? (
            <p className="hint" style={{ marginBottom: 8 }}>
              <b>Note model.</b> You do not have an account here. Your holdings are <b>notes</b>: sealed envelopes (an amount and a random
              nonce) that only you can open. The chain stores a <b>commitment</b> (a hash) per note in a Merkle tree; spending a note
              publishes its <b>nullifier</b> (another hash) so it cannot be spent twice. Neither hash reveals who or how much. Every note is
              also encrypted twice: once to the recipient (so their wallet finds it) and once to the <b>audit key</b>, so the auditor can
              open everything while the public sees nothing. A payment consumes one note and creates two: the recipient's and your change.
            </p>
          ) : (
            <p className="hint" style={{ marginBottom: 8 }}>
              <b>Account model.</b> A CFT account is <b>not</b> your wallet address. Connecting creates a confidential account in this
              browser (a secret key and a viewing key); its public <b>accountId</b> is what others need to send to you. The wallet only pays
              fees and signs. Anyone can <b>register</b>, no allowlist: the registration proof also <b>escrows</b> your viewing key on-chain,
              encrypted to a <b>compliance key</b> fixed at deployment (here the issuer's). Receiving requires registration, so every
              holder, including wallets the issuer has never heard of, can be audited, frozen and seized. Amounts are entered in tokens
              ("12.5") and are hidden on-chain; who sent to whom is public.
            </p>
          )}
          <ol className="steps">
            {activeSteps.map((s) => (
              <li key={s.label} className={s.done ? 'done' : s === nextStep ? 'next' : ''}>
                <span className="mark">{s.done ? '✓' : s === nextStep ? '→' : '·'}</span>
                <span>
                  <b>{s.label}</b> <span className="hint">{s.hint}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="hint">
            {noteClient
              ? 'To pay between two wallets: open this page in two browsers, each with its own wallet, join the same contract in both, and paste the other side\'s payment address (panel 3) into panel 4. No registration is needed.'
              : 'To move tokens between two wallets: open this page in two browsers (or two profiles), each with its own wallet, join the same contract address in both, register both, and paste the other side\'s accountId into panel 4.'}
          </p>
        </section>

        {/* ── Connect ─────────────────────────────────────────────────────── */}
        <section className="panel">
          <h2>1 · Wallet</h2>
          <div className="row">
            <div>
              <label>Wallet (window.midnight.*)</label>
              <select value={walletId} onChange={(e) => setWalletId(e.target.value)} disabled={!!wallet}>
                {wallets.length === 0 && <option value="">no wallet detected</option>}
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {walletDisplayName(w)} ({w.id}, api {w.api.apiVersion})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Network</label>
              <select value={networkKey} onChange={(e) => setNetworkKey(e.target.value as NetworkKey)} disabled={!!wallet}>
                {Object.values(NETWORKS).map((n) => (
                  <option key={n.key} value={n.key}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div>
              <label>Proving</label>
              <select value={proving} onChange={(e) => setProving(e.target.value as ProvingMode)} disabled={!!client}>
                <option value="wallet" disabled={!!wallet && !wallet.canProveInWallet}>
                  In the wallet{wallet && !wallet.canProveInWallet ? ' (not offered by this wallet)' : ''}
                </option>
                <option value="server">Proof server (HTTP)</option>
              </select>
            </div>
            {proving === 'server' && (
              <div style={{ flex: 1 }}>
                <label>Proof server URL (Docker: npm run docker:proof)</label>
                <input className="grow" style={{ width: '100%' }} value={proofServer} onChange={(e) => setProofServer(e.target.value)} />
              </div>
            )}
          </div>
          <p className="hint">
            {wallet
              ? wallet.canProveInWallet
                ? `${wallet.name} offers proving through the connector, so no proof server is needed.`
                : `${wallet.name} does not offer proving through the connector; a proof server is required.`
              : 'After connecting, proving defaults to the wallet if it offers it. The choice is fixed once you join or deploy a token.'}
          </p>
          <div className="row">
            <button onClick={onConnect} disabled={!!wallet || !walletId || !!busy}>
              Connect
            </button>
            {wallet && (
              <button className="secondary" onClick={() => window.location.reload()}>
                Disconnect
              </button>
            )}
          </div>
          <p className="hint">
            1AM shows up as <code>1am</code>, Lace as <code>mnLace</code>. 1AM sponsors fees; Lace needs DUST in the wallet.
          </p>
          {walletSearchDone && wallets.length === 0 && (
            <div className="banner mobile-help">
              {isMobile ? (
                <>
                  <b>On a phone, open this page inside the 1AM app.</b> Mobile browsers cannot host wallet extensions, so Safari or Chrome
                  will never see a wallet here. 1AM has a built-in dApp browser with an address bar that injects the connector.
                  <ol>
                    <li>Install 1AM from the App Store or Google Play and set it up.</li>
                    <li>In 1AM, open the dApp browser and paste this page's address into its address bar.</li>
                    <li>Pick the same network in 1AM's address bar as in panel 1, then Connect.</li>
                  </ol>
                  <button
                    className="secondary small"
                    onClick={() => {
                      void navigator.clipboard.writeText(window.location.href);
                      say('page URL copied; paste it into the 1AM dApp browser');
                    }}
                  >
                    Copy this page's URL
                  </button>
                </>
              ) : (
                <>
                  <b>No wallet found.</b> Install the 1AM or Lace browser extension, unlock it, and reload this page.
                </>
              )}
            </div>
          )}
        </section>

        {/* ── Contract ────────────────────────────────────────────────────── */}
        <section className="panel">
          <h2>2 · Token contract</h2>
          <label>Join an existing CFT by contract address</label>
          <div className="row">
            <input className="grow" placeholder="contract address (hex)" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
            <button onClick={onJoin} disabled={!wallet || !contractAddress || !!busy}>
              Join
            </button>
          </div>
          <label style={{ marginTop: 12 }}>…or deploy a new one (you become the issuer)</label>
          <div className="row">
            <select value={model} onChange={(e) => setModel(e.target.value as 'cft' | 'note')} disabled={!!busy}>
              <option value="cft">Account model (CFT): amounts hidden, accounts public</option>
              <option value="note">Note model: sender, recipient and amounts hidden; auditor sees all</option>
            </select>
          </div>
          <div className="row">
            <input style={{ width: 170 }} value={deployName} onChange={(e) => setDeployName(e.target.value)} placeholder="name" disabled={model === 'note'} />
            <input style={{ width: 80 }} value={deploySymbol} onChange={(e) => setDeploySymbol(e.target.value)} placeholder="symbol" disabled={model === 'note'} />
            <input style={{ width: 60 }} value={deployDecimals} onChange={(e) => setDeployDecimals(e.target.value)} placeholder="dec" />
            <button className="good" onClick={onDeploy} disabled={!wallet || !!busy}>
              Deploy
            </button>
          </div>
          {noteClient && (
            <dl className="kv" style={{ marginTop: 12 }}>
              <dt>Token</dt>
              <dd>
                Note model <span className="pill good">private graph</span> · {deployDecimals} decimals (display only; the contract has no metadata)
              </dd>
              <dt>Address</dt>
              <dd className="mono">
                {noteClient.address}{' '}
                <button className="secondary small" onClick={() => void navigator.clipboard.writeText(noteClient.address)}>
                  copy
                </button>
              </dd>
            </dl>
          )}
          {token && client && (
            <dl className="kv" style={{ marginTop: 12 }}>
              <dt>Token</dt>
              <dd>
                {token.name} ({token.symbol}), {token.decimals} decimals
              </dd>
              <dt>Address</dt>
              <dd className="mono">
                {client.address}{' '}
                <button className="secondary small" onClick={() => void navigator.clipboard.writeText(client.address)}>
                  copy
                </button>
              </dd>
              <dt>Total supply</dt>
              <dd>
                {fmt(token.totalSupply)} {token.symbol} <span className="pill">public</span>
              </dd>
              <dt>Issuer</dt>
              <dd className="mono">
                {short(token.issuerAccountId)} {isIssuer && <span className="pill good">you</span>}
              </dd>
              <dt>Accounts</dt>
              <dd>
                {token.registered} registered · {token.frozen.length} frozen ·{' '}
                {token.paused ? <span className="pill bad">PAUSED</span> : <span className="pill good">active</span>}
              </dd>
            </dl>
          )}
        </section>

        {noteClient ? (
          <NotePanels
            client={noteClient}
            network={network}
            decimals={Number(deployDecimals || 0)}
            busy={busy}
            lastTxHash={lastTxHash}
            run={run}
            tx={txNote}
            say={say}
            refreshTick={refreshTick}
          />
        ) : (
          <>
        {/* ── Account ─────────────────────────────────────────────────────── */}
        <section className="panel">
          <h2>3 · Your confidential account</h2>
          {identityId ? (
            <>
              <dl className="kv">
                <dt>accountId</dt>
                <dd className="mono">
                  {identityId}{' '}
                  <button className="secondary small" onClick={() => void navigator.clipboard.writeText(identityId)}>
                    copy
                  </button>
                </dd>
                <dt>Status</dt>
                <dd>
                  {!client ? (
                    <span className="pill">join a token first</span>
                  ) : !balances ? (
                    <span className="pill">syncing…</span>
                  ) : balances.registered ? (
                    <span className="pill good">registered</span>
                  ) : (
                    <span className="pill warn">not registered</span>
                  )}{' '}
                  {balances?.escrowed && <span className="pill">viewing key escrowed</span>}{' '}
                  {balances?.complianceHolder && <span className="pill good">compliance key: you</span>}{' '}
                  {balances?.frozen && <span className="pill bad">FROZEN</span>}
                </dd>
              </dl>
              <div className="row">
                <button
                  onClick={() => tx('Register', (c) => c.register())}
                  disabled={!client || !balances || balances.registered || !!busy}
                >
                  Register
                </button>
                <button className="secondary" onClick={() => run('Refresh', () => refresh())} disabled={!client || !!busy}>
                  Refresh
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    if (!client) return;
                    void navigator.clipboard.writeText(JSON.stringify(client.viewingKey()));
                    say('viewing key copied (accountId + viewing scalar). Whoever holds it can read your account, not spend from it. The compliance key already holds it through the on-chain escrow.');
                  }}
                  disabled={!client}
                >
                  Copy viewing key
                </button>
              </div>
              {balances && !balances.registered && (
                <p className="hint">
                  Not registered yet. Register publishes your encryption key (so others can send to you) and escrows your viewing key to the
                  compliance key in the same proof. No permission from the issuer is needed.
                </p>
              )}
              {balances?.registered && (
                <>
                  <div className="row" style={{ marginTop: 12 }}>
                    <div>
                      <label>Spendable</label>
                      <div className="balance">
                        {fmt(balances.spendable)}
                        <small>
                          {symbol} {SOURCE_LABEL[balances.spendableSource]}
                        </small>
                      </div>
                    </div>
                    <div>
                      <label>Pending (incoming, not yet swept)</label>
                      <div className="balance">
                        {fmt(balances.pending)}
                        <small>
                          {symbol} {SOURCE_LABEL[balances.pendingSource]}
                        </small>
                      </div>
                    </div>
                  </div>
                  {balances.spendable === undefined && (
                    <div className="row" style={{ alignItems: 'flex-end' }}>
                      <div>
                        <label>
                          This browser has no record of your spendable balance and it could not be reconstructed (memos, supply
                          reconciliation, bounded recovery). Enter the net amount you hold; it is verified before use, a wrong value is refused:
                        </label>
                        <input style={{ width: 160 }} value={knownBalance} onChange={(e) => setKnownBalance(e.target.value)} placeholder="e.g. 1000000" />
                      </div>
                      <button
                        onClick={() =>
                          run('Set known balance', async () => {
                            await client!.setKnownSpendable(parseAmount(knownBalance, decimals));
                            await refresh();
                          })
                        }
                        disabled={!knownBalance || !!busy}
                      >
                        Set known balance
                      </button>
                    </div>
                  )}
                  <div className="row">
                    <button
                      onClick={() => tx('Sweep pending → spendable', (c) => c.sweep())}
                      disabled={!!busy || !balances.pending || balances.spendable === undefined}
                    >
                      Sweep
                    </button>
                    {!!balances.pending && balances.spendable !== undefined && <span className="hint">moves {fmt(balances.pending)} into spendable</span>}
                  </div>
                  <label style={{ marginTop: 8 }}>Credit memos (decrypted with your viewing key, newest first)</label>
                  <ul className="plain">
                    {balances.memos.length === 0 && <li className="hint">none yet</li>}
                    {balances.memos.map((m, i) => (
                      <li key={i}>
                        + {fmt(m)} {symbol}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <p className="hint">Connect a wallet to create this browser's CFT identity (secret key + viewing key).</p>
          )}
        </section>

        {/* ── Transfer / burn ─────────────────────────────────────────────── */}
        <section className="panel">
          <h2>4 · Transfer &amp; burn</h2>
          <label>Recipient accountId (hex, 32 bytes; they must have registered)</label>
          <div className="row">
            <input className="grow" value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="recipient accountId" />
          </div>
          <div className="row">
            <input style={{ width: 140 }} value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder={`amount in ${symbol || 'tokens'}`} />
            <button
              onClick={() => tx(`Transfer ${transferAmount}`, (c) => c.transfer(transferTo.trim(), parseAmount(transferAmount, decimals)))}
              disabled={!client || !balances?.registered || !transferTo || !transferAmount || !!busy}
            >
              Send confidentially
            </button>
          </div>
          <p className="hint">Spends from <b>spendable</b> only (sweep first). Amount hidden on-chain; sender and recipient ids are public.</p>
          <div className="row" style={{ marginTop: 12 }}>
            <input style={{ width: 140 }} value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} placeholder={`amount in ${symbol || 'tokens'}`} />
            <button
              className="danger"
              onClick={() => tx(`Burn ${burnAmount}`, (c) => c.burn(parseAmount(burnAmount, decimals)))}
              disabled={!client || !balances?.registered || !burnAmount || !!busy}
            >
              Burn
            </button>
          </div>
          <p className="hint">Burning lowers the public totalSupply by the burned amount.</p>
        </section>

        {/* ── Issuer ──────────────────────────────────────────────────────── */}
        <section className={`panel issuer ${isIssuer ? 'active' : ''}`}>
          <h2>
            <span className="issuer-badge">ISSUER</span> 5 · Issuer controls{' '}
            {isIssuer ? <span className="pill good">you are the issuer</span> : <span className="pill">issuer only · read-only for you</span>}
          </h2>
          <p className="hint" style={{ marginTop: -6, marginBottom: 10 }}>
            Actions here need the issuer's secret key; they are proven on-chain by the Ownable check. Three scopes: <b>freeze</b>
            (one account), <b>pause</b> (the whole token), <b>seize</b> (panel 6, any frozen account). There is no onboarding: every
            holder's viewing key is already on-chain, escrowed to the compliance key.
          </p>
          <div className="subsection">
            <h3>Holders <span className="scope">escrowed viewing keys</span></h3>
            <p className="hint">
              Registration is permissionless, and each registration escrows the account's viewing key to the compliance key
              {balances?.complianceHolder ? ' (held by this browser)' : ''}. Any registered account, including one the issuer never met, can
              be opened, frozen and seized from here. Nothing is asked of the holder.
            </p>
          </div>
          {token && token.accounts.length > 0 && (
            <>
              <label>
                Registered accounts ({token.accounts.length}; {token.escrowed} escrowed;{' '}
                {storedKeys.filter((k) => k.accountId !== client?.accountId).length} key(s) opened in this browser)
              </label>
              <ul className="plain mono">
                {token.accounts.map((a) => {
                  const stored = storedKeys.find((k) => k.accountId === a);
                  const isMe = a === client?.accountId;
                  return (
                    <li key={a} className="row" style={{ margin: 0 }}>
                      <span>{short(a, 12)}</span>
                      {isMe && <span className="pill good">you</span>}
                      {token.frozen.includes(a) && <span className="pill bad">FROZEN</span>}
                      {stored && <span className="pill good">key opened</span>}
                      {!isMe && isIssuer && (
                        <>
                          <button className="secondary small" onClick={() => setFreezeTarget(a)}>
                            select
                          </button>
                          <button
                            className="secondary small"
                            onClick={() => onOpenEscrow(a)}
                            disabled={!!busy || !balances?.complianceHolder}
                            title={balances?.complianceHolder ? 'decrypt the escrow with the compliance key and inspect in panel 6' : 'this browser does not hold the compliance key'}
                          >
                            open key → panel 6
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {isIssuer && !balances?.complianceHolder && (
            <>
              <label>Import a disclosed viewing key (only needed because this browser does not hold the compliance key)</label>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <textarea
                  className="grow"
                  style={{ minHeight: 44 }}
                  value={importKey}
                  onChange={(e) => setImportKey(e.target.value)}
                  placeholder='{"accountId":"…","viewingKey":"…"}'
                />
                <button
                  className="secondary"
                  onClick={() =>
                    run('Store viewing key', async () => {
                      if (!client) throw new Error('join a token first');
                      await client.storeViewingKey(parseViewingKey(importKey));
                      setImportKey('');
                      await refresh();
                    })
                  }
                  disabled={!importKey || !!busy}
                >
                  Store key
                </button>
              </div>
            </>
          )}
          <div className="subsection">
            <h3>Mint <span className="scope">supply</span></h3>
            <p className="hint">Creates tokens into one account's pending balance and raises the public total supply by that amount.</p>
          </div>
          <label>Mint to accountId (your own to get started: paste from panel 3)</label>
          <div className="row">
            <input className="grow" value={mintTo} onChange={(e) => setMintTo(e.target.value)} placeholder="recipient accountId" />
            <input style={{ width: 120 }} value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="amount" />
            <button
              className="good"
              onClick={() => tx(`Mint ${mintAmount}`, (c) => c.mint(mintTo.trim(), parseAmount(mintAmount, decimals)))}
              disabled={!isIssuer || !mintTo || !mintAmount || !!busy}
            >
              Mint
            </button>
          </div>
          {isIssuer && identityId && (
            <p className="hint">
              <button className="secondary small" onClick={() => setMintTo(identityId)}>
                use my accountId
              </button>{' '}
              Minted tokens arrive in the recipient's <b>pending</b> balance.
            </p>
          )}
          <div className="subsection">
            <h3>Freeze <span className="scope">one account</span></h3>
            <p className="hint">
              Targets a single accountId. A frozen account cannot send, receive, burn or be minted to; everyone else is unaffected.
              Freezing is the precondition for seize (panel 6).
            </p>
          </div>
          <label>Freeze / unfreeze accountId</label>
          <div className="row">
            <input className="grow" value={freezeTarget} onChange={(e) => setFreezeTarget(e.target.value)} placeholder="accountId" />
            <button className="danger" onClick={() => tx('Freeze', (c) => c.freeze(freezeTarget.trim()))} disabled={!isIssuer || !freezeTarget || !!busy}>
              Freeze
            </button>
            <button className="secondary" onClick={() => tx('Unfreeze', (c) => c.unfreeze(freezeTarget.trim()))} disabled={!isIssuer || !freezeTarget || !!busy}>
              Unfreeze
            </button>
          </div>
          <div className="subsection killswitch">
            <h3>Pause <span className="scope global">global kill switch</span></h3>
            <p className="hint">
              Stops <b>every</b> transfer, burn and mint for <b>all</b> accounts at once, for incidents (key compromise, bug, legal order).
              Registering, sweeping, freezing and seizing still work. No per-account state changes; unpausing restores everything.
            </p>
            <div className="row">
              {token?.paused ? (
                <>
                  <span className="pill bad">TOKEN PAUSED</span>
                  <button className="good" onClick={() => tx('Unpause', (c) => c.unpause())} disabled={!isIssuer || !!busy}>
                    Unpause (resume all value movement)
                  </button>
                </>
              ) : (
                <>
                  <span className="pill good">token active</span>
                  <button className="danger" onClick={() => tx('Pause', (c) => c.pause())} disabled={!isIssuer || !!busy}>
                    Pause everything
                  </button>
                </>
              )}
            </div>
          </div>
          {token && token.frozen.length > 0 && (
            <>
              <label style={{ marginTop: 12 }}>Frozen accounts</label>
              <ul className="plain mono">
                {token.frozen.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* ── Viewer / seize ──────────────────────────────────────────────── */}
        <section className="panel wide">
          <h2>6 · Viewing key: audit and seize</h2>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 380px' }}>
              {isIssuer && (
                <>
                  <label>Issuer: open any registered account's escrowed viewing key with the compliance key</label>
                  <div className="row">
                    <input className="grow" value={escrowTarget} onChange={(e) => setEscrowTarget(e.target.value)} placeholder="accountId (or pick one in panel 5)" />
                    <button onClick={() => onOpenEscrow(escrowTarget)} disabled={!client || !escrowTarget || !!busy || !balances?.complianceHolder}>
                      Open escrow &amp; inspect
                    </button>
                  </div>
                </>
              )}
              <label>{isIssuer ? '…or paste' : 'Paste'} a viewing key export ({'{"accountId":…,"viewingKey":…}'})</label>
              <textarea value={viewerKey} onChange={(e) => setViewerKey(e.target.value)} placeholder='{"accountId":"…","viewingKey":"…"}' />
              <div className="row">
                <button onClick={onInspect} disabled={!client || !viewerKey || !!busy}>
                  Inspect account
                </button>
                <input
                  style={{ width: 170 }}
                  value={viewerClaim}
                  onChange={(e) => setViewerClaim(e.target.value)}
                  placeholder="holder-claimed spendable"
                />
              </div>
              <p className="hint">
                A viewing key opens memos and the pending balance exactly. The spendable balance is recovered from its ciphertext up to
                2^32 units; above that, ask the holder for the figure and enter it as the claim: it is verified, not trusted. A viewing key
                cannot spend.
              </p>
            </div>
            <div style={{ flex: '1 1 380px' }}>
              {inspection && (
                <dl className="kv">
                  <dt>Account</dt>
                  <dd className="mono">
                    {short(inspection.view.accountId)}{' '}
                    {inspection.view.registered ? <span className="pill good">registered</span> : <span className="pill warn">unregistered</span>}{' '}
                    {inspection.view.frozen && <span className="pill bad">FROZEN</span>}
                  </dd>
                  <dt>Spendable</dt>
                  <dd>
                    {fmt(inspection.spendable)} <span className="hint">{SOURCE_LABEL[inspection.spendableSource]}</span>
                    {inspection.spendable === undefined && claimed !== undefined && <span className="pill bad"> claim does not verify</span>}
                  </dd>
                  <dt>Pending</dt>
                  <dd>{fmt(inspection.pending)}</dd>
                  <dt>Total</dt>
                  <dd>
                    <b>{fmt(inspection.total)}</b> {symbol}
                  </dd>
                  <dt>Credits</dt>
                  <dd>{inspection.memos.length ? inspection.memos.map((m) => `+${fmt(m)}`).join(', ') : 'none'}</dd>
                </dl>
              )}
              {isIssuer && (
                <div style={{ marginTop: 12 }} className="subsection killswitch">
                  <h3>
                    Seize <span className="scope global">issuer · key from the escrow</span>
                  </h3>
                  {!inspection || !inspectionVk ? (
                    <p className="hint">
                      Inspect the holder first: pick any registered account in panel 5 ("open key → panel 6"), enter its accountId above, or
                      paste a disclosed viewing key, then <b>Inspect</b>. Seize moves the whole balance to a treasury account. The holder is
                      not involved.
                    </p>
                  ) : (
                    <>
                      <label>Seize entire balance to treasury accountId (default: you). Must be a different, registered account.</label>
                      <div className="row">
                        <input className="grow" value={seizeTo} onChange={(e) => setSeizeTo(e.target.value)} placeholder={client?.accountId} />
                        <button
                          className="danger"
                          disabled={!inspection.view.frozen || inspection.total === undefined || seizeSelf || !!busy}
                          onClick={() =>
                            tx(`Seize ${fmt(inspection.total)}`, (c) => c.seize(inspectionVk, seizeTo.trim() || c.accountId, claimed))
                          }
                        >
                          Seize {fmt(inspection.total)} {symbol}
                        </button>
                      </div>
                      <ul className="plain">
                        <li>
                          {inspection.view.frozen ? <span className="pill good">account is frozen</span> : <span className="pill warn">not frozen: freeze it in panel 5 first</span>}
                        </li>
                        <li>
                          {inspection.total !== undefined ? (
                            <span className="pill good">balance known: {fmt(inspection.total)}</span>
                          ) : (
                            <span className="pill warn">balance unknown: enter the holder-claimed spendable above and Inspect again</span>
                          )}
                        </li>
                        <li>
                          {seizeSelf ? (
                            <span className="pill warn">treasury equals the seized account: enter a different accountId</span>
                          ) : (
                            <span className="pill good">treasury: {short(seizeTo.trim() || client?.accountId || '', 8)}</span>
                          )}
                        </li>
                      </ul>
                      <p className="hint">
                        The circuit proves the viewing key is this account's and opens the frozen balance to exactly this amount, zeroes the
                        account and credits the treasury. Total supply is unchanged; the amount is not revealed on-chain.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Observer ────────────────────────────────────────────────────── */}
        <section className="panel wide">
          <h2>7 · What the chain sees</h2>
          <p className="hint" style={{ marginBottom: 8 }}>
            Left: what anyone can read from an explorer or the indexer. Right: what the holder of the relevant viewing key can read.
            Every row on the left comes from the public ledger and the transaction bytes; nothing is taken from this browser's secrets.
          </p>
          <div className="row">
            <button className={obsTab === 'tx' ? '' : 'secondary'} onClick={() => setObsTab('tx')}>
              Transaction
            </button>
            <button className={obsTab === 'account' ? '' : 'secondary'} onClick={() => setObsTab('account')}>
              Account
            </button>
            {obsTab === 'tx' ? (
              <>
                <input className="grow" value={obsHash} onChange={(e) => setObsHash(e.target.value)} placeholder="transaction hash (filled in after each of your transactions)" />
                <button className="secondary" onClick={() => run('Observe transaction', () => observe('tx', obsHash))} disabled={!client || !obsHash || !!busy}>
                  Show
                </button>
              </>
            ) : (
              <>
                <input className="grow" value={obsAccount} onChange={(e) => setObsAccount(e.target.value)} placeholder={client ? `accountId (empty = you: ${short(client.accountId, 6)})` : 'accountId'} />
                <button className="secondary" onClick={() => run('Observe account', () => observe('account', obsAccount))} disabled={!client || !!busy}>
                  Show
                </button>
              </>
            )}
          </div>
          {obsRows && (
            <div className="observe">
              <div className="observe-head">{obsTitle}</div>
              <div className="observe-grid">
                <div className="observe-col-head" />
                <div className="observe-col-head public">Anyone (explorer / indexer)</div>
                <div className="observe-col-head private">Viewing-key holder</div>
                {obsRows.map((r) => (
                  <div key={r.label} className="observe-row">
                    <div className="observe-label">{r.label}</div>
                    <div className={`observe-cell public ${r.hidden ? 'redacted' : ''}`}>{r.publicValue}</div>
                    <div className={`observe-cell private ${r.hidden ? 'revealed' : 'same'}`}>{r.privateValue}</div>
                  </div>
                ))}
              </div>
              <p className="hint">
                Rule of thumb: <b>who</b> and <b>what kind</b> of action are public; <b>how much</b> is private, except that mint and
                burn amounts leak through the public total supply.
              </p>
            </div>
          )}
        </section>

          </>
        )}

        {/* ── Log ─────────────────────────────────────────────────────────── */}
        <section className="panel wide">
          <h2>Activity</h2>
          <div className="log">
            {log.length === 0 && <span className="hint">nothing yet</span>}
            {log.map((l, i) => (
              <div key={i} className={l.kind}>
                <span className="time">{l.t}</span>
                {l.msg}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
