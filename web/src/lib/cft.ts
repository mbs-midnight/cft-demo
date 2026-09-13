// Browser-side CFT client: providers built on the connected wallet, deploy /
// join, and the confidential-token bookkeeping (seed rotation, plaintext
// cache, memo replay) around every circuit call. Mirrors cli/src/api.ts.
import { CompiledContract, type ProvableCircuitId } from '@midnight-ntwrk/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  deployContract,
  findDeployedContract,
  type DeployedContract,
  type FoundContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { createProofProvider, type FinalizedTxData, type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { dappConnectorProvingProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import {
  CftDemo,
  CftPrivateState,
  accountIdFromSecretKey,
  addCiphertexts,
  fromHex,
  memoHistory,
  readAccount,
  readToken,
  resolvePending,
  resolveSpendable,
  toHex,
  verifyBalance,
  witnesses,
  type AccountView,
  type BalanceSource,
  type Ledger,
  type TokenInfo,
  type ViewingKeyExport,
} from 'cft-demo-contract';
import type { NetworkConfig } from './config.js';
import { connectorProviders, type ConnectedWallet } from './wallet.js';

export type CftContract = CftDemo.Contract<CftPrivateState>;
export type CftCircuits = ProvableCircuitId<CftContract>;
export const PRIVATE_STATE_ID = 'cftDemoPrivateState';
export type CftProviders = MidnightProviders<CftCircuits, typeof PRIVATE_STATE_ID, CftPrivateState>;
export type DeployedCft = DeployedContract<CftContract> | FoundContract<CftContract>;

const ZK_PATH = './contract/cft-demo';

export const compiledContract = CompiledContract.make<CftContract>('CftDemo', CftDemo.Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(ZK_PATH),
);

// ── Identity (SK / EK) per connected wallet, kept in this browser ──────────

const identityKey = (walletAddress: string) => `cft-demo/identity/${walletAddress}`;

export const loadOrCreateIdentity = (walletAddress: string): CftPrivateState => {
  try {
    const raw = localStorage.getItem(identityKey(walletAddress));
    if (raw) {
      const parsed = JSON.parse(raw) as { secretKeyHex: string; encryptionKeyHex: string };
      return CftPrivateState.fromSecrets(parsed.secretKeyHex, parsed.encryptionKeyHex);
    }
  } catch {
    /* fall through: create a new identity */
  }
  const fresh = CftPrivateState.generate();
  saveIdentity(walletAddress, fresh);
  return fresh;
};

export const saveIdentity = (walletAddress: string, s: CftPrivateState): void => {
  localStorage.setItem(
    identityKey(walletAddress),
    JSON.stringify({ secretKeyHex: s.secretKeyHex, encryptionKeyHex: s.encryptionKeyHex }),
  );
};

export const accountIdOf = (s: CftPrivateState): string => toHex(accountIdFromSecretKey(fromHex(s.secretKeyHex)));

// ── Providers ──────────────────────────────────────────────────────────────

export type ProvingMode = 'wallet' | 'server';

/**
 * Proving: either delegated to the wallet through the connector's
 * `getProvingProvider` (1AM proves inside the wallet / its ProofStation; the
 * DApp never talks to a proof server), or sent to an HTTP proof server.
 */
export const makeProviders = async (
  wallet: ConnectedWallet,
  network: NetworkConfig,
  proving: ProvingMode,
  proofServerUrl: string,
): Promise<CftProviders> => {
  const zkConfigProvider = new FetchZkConfigProvider<CftCircuits>(
    `${window.location.origin}/${ZK_PATH.replace(/^\.\//, '')}`,
    fetch.bind(window),
  );
  const walletAndMidnight = connectorProviders(wallet);
  if (proving === 'wallet' && !wallet.canProveInWallet) {
    throw new Error(`${wallet.name} does not expose getProvingProvider; switch proving to the proof server`);
  }
  const proofProvider =
    proving === 'wallet'
      ? createProofProvider(await dappConnectorProvingProvider(wallet.api, zkConfigProvider))
      : httpClientProofProvider(proofServerUrl, zkConfigProvider);
  return {
    privateStateProvider: levelPrivateStateProvider({
      midnightDbName: 'cft-demo',
      privateStateStoreName: 'cft-demo-private-state',
      privateStoragePasswordProvider: () => 'CftDemo-Pr1vate!State-2026',
      accountId: wallet.unshieldedAddress,
    }),
    publicDataProvider: indexerPublicDataProvider(network.indexer, network.indexerWS),
    zkConfigProvider,
    proofProvider,
    walletProvider: walletAndMidnight,
    midnightProvider: walletAndMidnight,
  };
};

export const deploy = (
  providers: CftProviders,
  issuerState: CftPrivateState,
  name: string,
  symbol: string,
  decimals: bigint,
): Promise<DeployedCft> =>
  deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: issuerState,
    args: [name, symbol, decimals, accountIdFromSecretKey(fromHex(issuerState.secretKeyHex))],
  });

/**
 * Join an existing contract WITHOUT clobbering what this browser already knows.
 * midnight-js overwrites the stored private state whenever `initialPrivateState`
 * is passed together with `privateStateId`, so pass it only when nothing is
 * stored yet (first join from this wallet).
 */
export const join = async (providers: CftProviders, contractAddress: string, state: CftPrivateState): Promise<DeployedCft> => {
  const address = contractAddress.trim() as ContractAddress;
  providers.privateStateProvider.setContractAddress(address);
  const stored = await providers.privateStateProvider.get(PRIVATE_STATE_ID);
  if (stored) return findDeployedContract(providers, { contractAddress: address, compiledContract, privateStateId: PRIVATE_STATE_ID });
  return findDeployedContract(providers, { contractAddress: address, compiledContract, privateStateId: PRIVATE_STATE_ID, initialPrivateState: state });
};

export interface TxReceipt {
  txId: string;
  blockHeight: number;
}
const receipt = (tx: FinalizedTxData): TxReceipt => ({ txId: tx.txId, blockHeight: Number(tx.blockHeight) });

export interface Balances {
  onboarded: boolean;
  registered: boolean;
  frozen: boolean;
  spendable: bigint | undefined;
  pending: bigint | undefined;
  spendableSource: BalanceSource;
  pendingSource: BalanceSource;
  memos: bigint[];
}

export interface Inspection {
  view: AccountView;
  memos: bigint[];
  spendable: bigint | undefined;
  spendableSource: BalanceSource;
  pending: bigint | undefined;
  total: bigint | undefined;
}

export const UNKNOWN_SPENDABLE =
  'Spendable balance unknown: this browser has no record of it and it is above the recovery bound. ' +
  'Enter the balance you know in the account panel (it is verified against the ciphertext before use).';

export class CftClient {
  constructor(
    readonly providers: CftProviders,
    readonly contract: DeployedCft,
    /** The identity this browser uses for the contract; kept in sync with the private-state store. */
    readonly identity: CftPrivateState,
  ) {}

  get address(): string {
    return this.contract.deployTxData.public.contractAddress;
  }

  get accountId(): string {
    return accountIdOf(this.identity);
  }

  /**
   * Attach to a deployed/found contract. The private-state store is the
   * source of truth for the identity: if this wallet already used the contract,
   * the stored SK / EK win over whatever localStorage suggested, so a cleared
   * localStorage can never strand a funded account.
   */
  static async attach(providers: CftProviders, contract: DeployedCft, suggested: CftPrivateState): Promise<CftClient> {
    const stored = await providers.privateStateProvider.get(PRIVATE_STATE_ID);
    return new CftClient(providers, contract, stored ?? suggested);
  }

  async state(): Promise<CftPrivateState> {
    const s = await this.providers.privateStateProvider.get(PRIVATE_STATE_ID);
    if (!s) throw new Error('private state missing');
    return s;
  }

  async setState(s: CftPrivateState): Promise<void> {
    await this.providers.privateStateProvider.set(PRIVATE_STATE_ID, s);
  }

  async ledger(): Promise<Ledger> {
    const cs = await this.providers.publicDataProvider.queryContractState(this.address as ContractAddress);
    if (!cs) throw new Error(`contract ${this.address} not found on chain`);
    return CftDemo.ledger(cs.data);
  }

  async token(): Promise<TokenInfo> {
    return readToken(await this.ledger());
  }

  async view(): Promise<AccountView> {
    return readAccount(await this.ledger(), this.accountId);
  }

  /**
   * Registered / frozen flags, memo history and both balances. Never throws for
   * an unknown balance: `spendable` is `undefined` with source `'unknown'`.
   */
  async balances(): Promise<Balances> {
    const view = await this.view();
    let s = await this.state();
    const ek = s.encryptionKeyHex;
    const memos = view.registered ? memoHistory(view, ek) : [];
    const pe = resolvePending(view, ek);
    let sp = resolveSpendable(view, ek, s);
    if (sp.value === undefined && view.spendableCt && pe.value !== undefined && Object.keys(s.viewingKeys).length > 0) {
      // Issuer reconciliation: totalSupply is public and the issuer holds the
      // viewing keys of every onboarded holder, so its own spendable is the
      // supply minus everyone else's balance minus its own pending. Verified
      // against the ciphertext like any other candidate.
      const ledger = await this.ledger();
      let others = 0n;
      let complete = true;
      for (const [acct, vk] of Object.entries(s.viewingKeys)) {
        if (acct === this.accountId) continue;
        const v = readAccount(ledger, acct);
        if (!v.registered) continue;
        const osp = resolveSpendable(v, vk);
        const ope = resolvePending(v, vk);
        if (osp.value === undefined || ope.value === undefined) {
          complete = false;
          break;
        }
        others += osp.value + ope.value;
      }
      if (complete) {
        const candidate = ledger.Supply__totalSupply - others - pe.value;
        if (candidate >= 0n && verifyBalance(view.spendableCt, fromHex(ek), candidate)) sp = { value: candidate, source: 'candidate' };
      }
    }
    if (view.spendableCt && sp.value !== undefined) s = CftPrivateState.cachePlaintext(s, view.spendableCt, sp.value);
    if (view.pendingCt && pe.value !== undefined) s = CftPrivateState.cachePlaintext(s, view.pendingCt, pe.value);
    await this.setState(s);
    return {
      onboarded: view.onboarded,
      registered: view.registered,
      frozen: view.frozen,
      spendable: sp.value,
      pending: pe.value,
      spendableSource: sp.source,
      pendingSource: pe.source,
      memos,
    };
  }

  /** Holder-supplied balance: accepted only if it really is the plaintext of the current spendable ciphertext. */
  async setKnownSpendable(value: bigint): Promise<void> {
    const view = await this.view();
    if (!view.spendableCt) throw new Error('account not registered');
    const s = await this.state();
    if (!verifyBalance(view.spendableCt, fromHex(s.encryptionKeyHex), value)) {
      throw new Error('that is not the plaintext of your current spendable balance');
    }
    await this.setState(CftPrivateState.cachePlaintext(s, view.spendableCt, value));
  }

  viewingKey(): ViewingKeyExport {
    return { accountId: this.accountId, viewingKey: this.identity.encryptionKeyHex };
  }

  private async rotateSeed(): Promise<void> {
    await this.setState(CftPrivateState.withFreshSeed(await this.state()));
  }

  /** For debits and sweeps: the current spendable must be known; remember what it will become. */
  private async prepareSpend(delta: (b: Balances) => bigint): Promise<Balances> {
    const b = await this.balances();
    if (!b.registered) throw new Error('register first');
    if (b.spendable === undefined) throw new Error(UNKNOWN_SPENDABLE);
    if (b.pending === undefined) throw new Error('pending balance could not be resolved from memos');
    await this.setState(CftPrivateState.withSpendableCandidate(await this.state(), delta(b)));
    await this.rotateSeed();
    return b;
  }

  async register(): Promise<TxReceipt> {
    const view = await this.view();
    if (view.registered) throw new Error('already registered');
    if (!view.onboarded) throw new Error('not onboarded: send your viewing key to the issuer and ask them to onboard your accountId');
    await this.rotateSeed();
    return receipt((await this.contract.callTx.register()).public);
  }

  /**
   * Issuer: onboard a holder. The holder's viewing key export is the KYC
   * artifact: it is stored in the issuer's private state (so `seize` can use it
   * later) and the accountId is added to the on-chain allowlist.
   */
  async onboard(vk: ViewingKeyExport): Promise<TxReceipt> {
    const s = await this.state();
    await this.setState(CftPrivateState.withViewingKey(s, vk.accountId, vk.viewingKey));
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setOnboarded(fromHex(vk.accountId), true)).public);
  }

  async offboard(account: string): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setOnboarded(fromHex(account), false)).public);
  }

  /** Store a holder's viewing key locally (no transaction), e.g. to restore one after a reset. */
  async storeViewingKey(vk: ViewingKeyExport): Promise<void> {
    await this.setState(CftPrivateState.withViewingKey(await this.state(), vk.accountId, vk.viewingKey));
  }

  /** Viewing keys collected at onboarding, by accountId. */
  async storedViewingKeys(): Promise<ViewingKeyExport[]> {
    const s = await this.state();
    return Object.entries(s.viewingKeys).map(([accountId, viewingKey]) => ({ accountId, viewingKey }));
  }
  async sweep(): Promise<TxReceipt> {
    await this.prepareSpend((b) => b.spendable! + b.pending!);
    return receipt((await this.contract.callTx.sweep()).public);
  }
  async transfer(to: string, value: bigint): Promise<TxReceipt> {
    const b = await this.prepareSpend((b) => b.spendable! - value);
    if (b.spendable! < value) throw new Error('insufficient spendable balance (sweep pending first?)');
    return receipt((await this.contract.callTx.transfer(fromHex(to), value)).public);
  }
  async burn(value: bigint): Promise<TxReceipt> {
    const b = await this.prepareSpend((b) => b.spendable! - value);
    if (b.spendable! < value) throw new Error('insufficient spendable balance (sweep pending first?)');
    return receipt((await this.contract.callTx.burn(value)).public);
  }
  async mint(to: string, value: bigint): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.mint(fromHex(to), value)).public);
  }
  async freeze(account: string): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setFrozen(fromHex(account), true)).public);
  }
  async unfreeze(account: string): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setFrozen(fromHex(account), false)).public);
  }
  async pause(): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setPaused(true)).public);
  }
  async unpause(): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setPaused(false)).public);
  }

  /**
   * Anyone holding a viewing key can read that account: memos and pending
   * exactly, spendable by bounded recovery (or a holder-claimed value, verified).
   */
  async inspect(vk: ViewingKeyExport, claimedSpendable?: bigint): Promise<Inspection> {
    const view = readAccount(await this.ledger(), vk.accountId);
    const memos = view.registered ? memoHistory(view, vk.viewingKey) : [];
    const pe = resolvePending(view, vk.viewingKey);
    let sp = resolveSpendable(view, vk.viewingKey);
    if (sp.value === undefined && claimedSpendable !== undefined && view.spendableCt) {
      if (verifyBalance(view.spendableCt, fromHex(vk.viewingKey), claimedSpendable)) {
        sp = { value: claimedSpendable, source: 'candidate' };
      }
    }
    const total = sp.value !== undefined && pe.value !== undefined ? sp.value + pe.value : undefined;
    return { view, memos, spendable: sp.value, spendableSource: sp.source, pending: pe.value, total };
  }

  async seize(vk: ViewingKeyExport, to: string, claimedSpendable?: bigint): Promise<TxReceipt & { amount: bigint }> {
    const { view, total } = await this.inspect(vk, claimedSpendable);
    if (!view.spendableCt || !view.pendingCt) throw new Error('target account is not registered');
    if (!view.frozen) throw new Error('freeze the account first');
    if (vk.accountId === to.toLowerCase()) {
      throw new Error('the treasury must be a different registered account than the one being seized (use another wallet\'s accountId)');
    }
    if (total === undefined) throw new Error('could not open the balance with this viewing key (or it is above the recovery bound: enter the holder-disclosed balance)');
    const totalCt = addCiphertexts(view.spendableCt, view.pendingCt);
    let s = await this.state();
    s = CftPrivateState.withViewingKey(s, vk.accountId, vk.viewingKey);
    s = CftPrivateState.withViewedBalance(s, totalCt, total);
    await this.setState(s);
    await this.rotateSeed();
    const tx = await this.contract.callTx.seize(fromHex(vk.accountId), fromHex(to));
    return { ...receipt(tx.public), amount: total };
  }
}
