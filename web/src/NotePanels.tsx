import { useCallback, useEffect, useState } from 'react';
import { formatUnits, parseAmount, shortPk, type AuditedNote, type NoteTokenInfo, type NoteWalletView } from 'cft-demo-contract';
import type { NetworkConfig } from './lib/config';
import { NoteClient, type NoteRoles } from './lib/note';
import { observeNoteTransaction, type ObservedRow } from './lib/observe';

const short = (s: string, n = 10) => (s.length > 2 * n ? `${s.slice(0, n)}…${s.slice(-n)}` : s);

export interface NotePanelsProps {
  client: NoteClient;
  network: NetworkConfig;
  decimals: number;
  busy: string | undefined;
  lastTxHash: string | undefined;
  run: <T>(label: string, fn: () => Promise<T>, after?: (r: T) => void | Promise<void>) => Promise<void>;
  tx: (label: string, fn: () => Promise<{ txId: string; blockHeight: number }>) => Promise<void>;
  say: (msg: string, kind?: 'info' | 'ok' | 'err') => void;
  /** Bumped by the shell after every transaction so panels refetch. */
  refreshTick: number;
}

export function NotePanels({ client, network, decimals, busy, lastTxHash, run, tx, say, refreshTick }: NotePanelsProps) {
  const [token, setToken] = useState<NoteTokenInfo | undefined>();
  const [roles, setRoles] = useState<NoteRoles>({ issuer: false, authority: false, auditor: false });
  const [view, setView] = useState<NoteWalletView | undefined>();
  const [audit, setAudit] = useState<AuditedNote[] | undefined>();
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [obsHash, setObsHash] = useState('');
  const [obsRows, setObsRows] = useState<ObservedRow[] | undefined>();

  const fmt = (v: bigint | undefined) => (v === undefined ? '?' : formatUnits(v, decimals));
  const myAddress = JSON.stringify(client.paymentAddress);
  const myPk = client.paymentAddress.pk;
  const nameOfPk = (pk: string) => (pk === myPk ? `you ${shortPk(pk)}` : shortPk(pk));

  const refresh = useCallback(async () => {
    const [t, r, v] = await Promise.all([client.token(), client.roles(), client.notes()]);
    setToken(t);
    setRoles(r);
    setView(v);
    setAudit(r.auditor ? await client.audit() : undefined);
  }, [client]);

  useEffect(() => {
    refresh().catch((e) => say(`note sync: ${e instanceof Error ? e.message : String(e)}`, 'err'));
  }, [refresh, refreshTick, say]);

  useEffect(() => {
    if (lastTxHash) setObsHash(lastTxHash);
  }, [lastTxHash]);

  const observe = (hash: string) =>
    run('Observe transaction', async () => {
      const t = await client.token();
      const newest = roles.auditor ? (await client.audit()).map((a) => ({ ownerPk: a.ownerPk, value: a.note.value, spent: a.spent })) : undefined;
      const r = await observeNoteTransaction(network.indexer, hash.trim(), client.address, decimals, t, newest, nameOfPk);
      setObsRows(r.rows);
    });

  const live = view?.notes.filter((n) => !n.spent) ?? [];

  return (
    <>
      {/* ── Account ─────────────────────────────────────────────────────── */}
      <section className="panel">
        <h2>3 · Your notes</h2>
        <dl className="kv">
          <dt>Payment address</dt>
          <dd className="mono">
            pk {shortPk(myPk)}{' '}
            <button
              className="secondary small"
              onClick={() => {
                void navigator.clipboard.writeText(myAddress);
                say('payment address copied (spend pk + delivery pk). Give it to whoever pays you.');
              }}
            >
              copy address
            </button>
          </dd>
          <dt>Roles</dt>
          <dd>
            {roles.issuer && <span className="pill good">issuer</span>} {roles.authority && <span className="pill good">authority</span>}{' '}
            {roles.auditor && <span className="pill good">auditor</span>} {!roles.issuer && !roles.authority && !roles.auditor && <span className="pill">holder</span>}
          </dd>
        </dl>
        <div className="row" style={{ marginTop: 12 }}>
          <div>
            <label>Spendable (sum of live, unfrozen notes)</label>
            <div className="balance">{fmt(view?.spendable)}</div>
          </div>
          {!!view?.frozenValue && (
            <div>
              <label>Frozen</label>
              <div className="balance" style={{ color: 'var(--danger)' }}>
                {fmt(view.frozenValue)}
              </div>
            </div>
          )}
          <button className="secondary" onClick={() => run('Refresh', refresh)} disabled={!!busy}>
            Refresh
          </button>
        </div>
        <label style={{ marginTop: 8 }}>Notes (each is one spendable unit; a payment consumes one note and returns change)</label>
        <ul className="plain">
          {view && view.notes.length === 0 && <li className="hint">none yet: ask the issuer to mint to your payment address</li>}
          {view?.notes.map((n) => (
            <li key={n.commitment} className="row" style={{ margin: 0 }}>
              <span style={{ minWidth: 90 }}>{fmt(n.note.value)}</span>
              {n.spent ? <span className="pill">spent</span> : n.frozen ? <span className="pill bad">FROZEN</span> : <span className="pill good">live</span>}
              <span className="hint mono">nf {short(n.nullifier, 6)}</span>
            </li>
          ))}
        </ul>
        <p className="hint">There is no public account for you on-chain: only commitments and nullifiers exist. Your notes are found by opening every delivery with your delivery secret.</p>
      </section>

      {/* ── Transfer / burn ─────────────────────────────────────────────── */}
      <section className="panel">
        <h2>4 · Transfer &amp; burn</h2>
        <label>Recipient payment address (JSON they copied from their panel 3)</label>
        <textarea value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder='{"pk":"0x…","encPk":{"x":"0x…","y":"0x…"}}' />
        <div className="row">
          <input style={{ width: 140 }} value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="amount" />
          <button
            onClick={() => tx(`Transfer ${transferAmount}`, () => client.transfer(transferTo, parseAmount(transferAmount, decimals), decimals))}
            disabled={!transferTo || !transferAmount || !!busy}
          >
            Send privately
          </button>
        </div>
        <p className="hint">
          Sender, recipient and amount are all hidden on-chain. One note is consumed per payment; the largest note you can spend at once is{' '}
          {fmt(view?.largestSpendable)}.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <input style={{ width: 140 }} value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} placeholder="amount" />
          <button className="danger" onClick={() => tx(`Burn ${burnAmount}`, () => client.burn(parseAmount(burnAmount, decimals), decimals))} disabled={!burnAmount || !!busy}>
            Burn
          </button>
        </div>
        <p className="hint">Supply is encrypted, so even a burn amount is not public (unlike the account model).</p>
      </section>

      {/* ── Issuer / authority / auditor ────────────────────────────────── */}
      <section className={`panel issuer ${roles.issuer || roles.authority || roles.auditor ? 'active' : ''}`}>
        <h2>
          <span className="issuer-badge">ROLES</span> 5 · Issuer, authority, auditor{' '}
          {roles.issuer || roles.authority || roles.auditor ? <span className="pill good">you hold roles</span> : <span className="pill">read-only for you</span>}
        </h2>
        <p className="hint" style={{ marginTop: -6, marginBottom: 10 }}>
          Three roles bound at deploy: <b>issuer</b> mints, <b>authority</b> freezes and seizes notes, <b>auditor</b> reads everything. This demo's deployer holds all three.
        </p>
        <div className="subsection">
          <h3>Mint <span className="scope">issuer</span></h3>
          <p className="hint">Creates one note for the recipient. Amount hidden; supply encrypted.</p>
        </div>
        <textarea value={mintTo} onChange={(e) => setMintTo(e.target.value)} placeholder="recipient payment address JSON" style={{ minHeight: 44 }} />
        <div className="row">
          <input style={{ width: 120 }} value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} placeholder="amount" />
          <button className="good" onClick={() => tx(`Mint ${mintAmount}`, () => client.mint(mintTo, parseAmount(mintAmount, decimals)))} disabled={!roles.issuer || !mintTo || !mintAmount || !!busy}>
            Mint
          </button>
          {roles.issuer && (
            <button className="secondary small" onClick={() => setMintTo(myAddress)}>
              use my address
            </button>
          )}
        </div>

        <div className="subsection">
          <h3>Audit trail <span className="scope">auditor</span></h3>
          <p className="hint">
            Every output ever created, opened with the audit key: owner, amount, whether it has been spent. This is the travel-rule data set; the public sees none of it.
          </p>
        </div>
        {!roles.auditor && <p className="hint">You do not hold the audit key.</p>}
        {audit && (
          <div className="observe-grid audit-table">
            <div className="observe-col-head">owner</div>
            <div className="observe-col-head">amount</div>
            <div className="observe-col-head">status · actions</div>
            {audit.map((a) => (
              <div key={a.commitment} className="observe-row">
                <div className="observe-cell mono">{nameOfPk(a.ownerPk)}</div>
                <div className="observe-cell">{fmt(a.note.value)}</div>
                <div className="observe-cell">
                  <span className="row" style={{ margin: 0 }}>
                    {a.spent ? <span className="pill">spent</span> : a.frozen ? <span className="pill bad">FROZEN</span> : <span className="pill good">live</span>}
                    {roles.authority && !a.spent && (
                      <>
                        <button className={`small ${a.frozen ? 'secondary' : 'danger'}`} onClick={() => tx(a.frozen ? 'Unfreeze note' : 'Freeze note', () => client.setFrozen(a.nullifier, !a.frozen))} disabled={!!busy}>
                          {a.frozen ? 'unfreeze' : 'freeze'}
                        </button>
                        <button className="danger small" onClick={() => tx(`Seize ${fmt(a.note.value)}`, () => client.seize(a, myAddress))} disabled={!!busy}>
                          seize → me
                        </button>
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="hint" style={{ marginTop: 8 }}>
          <b>Freeze</b> publishes the note's nullifier (reversible, nothing else revealed). <b>Seize</b> consumes the note and re-mints its value to the authority, with no cooperation from the owner and no key escrow: the audit trail alone supplies the witnesses.
        </p>
      </section>

      {/* ── Observer ────────────────────────────────────────────────────── */}
      <section className="panel wide">
        <h2>7 · What the chain sees</h2>
        <p className="hint" style={{ marginBottom: 8 }}>
          Left: anyone with an explorer. Right: the audit-key holder. In the note model there is no Account tab: no public account exists.
        </p>
        <div className="row">
          <input className="grow" value={obsHash} onChange={(e) => setObsHash(e.target.value)} placeholder="transaction hash (filled in after each of your transactions)" />
          <button className="secondary" onClick={() => observe(obsHash)} disabled={!obsHash || !!busy}>
            Show
          </button>
        </div>
        {obsRows && (
          <div className="observe">
            <div className="observe-grid">
              <div className="observe-col-head" />
              <div className="observe-col-head public">Anyone (explorer / indexer)</div>
              <div className="observe-col-head private">Audit-key holder</div>
              {obsRows.map((r) => (
                <div key={r.label} className="observe-row">
                  <div className="observe-label">{r.label}</div>
                  <div className={`observe-cell public ${r.hidden ? 'redacted' : ''}`}>{r.publicValue}</div>
                  <div className={`observe-cell private ${r.hidden ? 'revealed' : 'same'}`}>{r.privateValue}</div>
                </div>
              ))}
            </div>
            <p className="hint">Rule of thumb for notes: <b>nothing</b> about who or how much is public; the auditor sees everything by construction.</p>
          </div>
        )}
        {token && (
          <p className="hint">
            Public totals right now: {token.commitments} commitments, {token.nullifiers} nullifiers, {token.frozen} frozen, {token.seizures} seizures.
          </p>
        )}
      </section>
    </>
  );
}
