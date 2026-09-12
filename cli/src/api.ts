// midnight-js 4.1.1 wiring for the CFT demo: providers, deploy / join, and a
// `CftClient` that keeps the confidential-token bookkeeping (seed rotation,
// plaintext cache, memo replay) next to every circuit call.
import path from 'node:path';
import { WebSocket } from 'ws';
import { CompiledContract, type ProvableCircuitId } from '@midnight-ntwrk/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  deployContract,
  findDeployedContract,
  type DeployedContract,
  type FoundContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type { FinalizedTxData, MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
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
import type { Config } from './common/config.js';
import { createWalletAndMidnightProvider, type WalletContext } from './common/wallet.js';

// Apollo subscriptions need a WebSocket in Node.
// @ts-expect-error: polyfill for the indexer's GraphQL subscriptions
globalThis.WebSocket = WebSocket;

export type CftContract = CftDemo.Contract<CftPrivateState>;
export type CftCircuits = ProvableCircuitId<CftContract>;
export const PRIVATE_STATE_ID = 'cftDemoPrivateState';
export type CftProviders = MidnightProviders<CftCircuits, typeof PRIVATE_STATE_ID, CftPrivateState>;
export type DeployedCft = DeployedContract<CftContract> | FoundContract<CftContract>;

const here = path.dirname(new URL(import.meta.url).pathname);
export const ZK_CONFIG_PATH = path.resolve(here, '..', '..', 'contract', 'src', 'managed', 'cft-demo');

export const compiledContract = CompiledContract.make<CftContract>('CftDemo', CftDemo.Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(ZK_CONFIG_PATH),
);

/**
 * One provider set per actor: the wallet (fees) can be shared, the private
 * state store must not be, since it holds the actor's SK / EK / cache.
 */
export const makeProviders = async (config: Config, wallet: WalletContext, actor: string): Promise<CftProviders> => {
  const zkConfigProvider = new NodeZkConfigProvider<CftCircuits>(ZK_CONFIG_PATH);
  const walletAndMidnight = await createWalletAndMidnightProvider(wallet);
  return {
    privateStateProvider: levelPrivateStateProvider({
      midnightDbName: path.resolve(here, '..', '.state', config.name, actor),
      privateStateStoreName: 'cft-demo-private-state',
      privateStoragePasswordProvider: () => 'CftDemo-Pr1vate!State-2026',
      accountId: wallet.address,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnight,
    midnightProvider: walletAndMidnight,
  };
};

export const deploy = async (
  providers: CftProviders,
  issuerState: CftPrivateState,
  name: string,
  symbol: string,
  decimals: bigint,
): Promise<DeployedCft> => {
  const issuerId = accountIdFromSecretKey(fromHex(issuerState.secretKeyHex));
  return deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: issuerState,
    args: [name, symbol, decimals, issuerId],
  });
};

export const join = async (
  providers: CftProviders,
  contractAddress: string,
  initialPrivateState: CftPrivateState,
): Promise<DeployedCft> =>
  findDeployedContract(providers, {
    contractAddress: contractAddress as ContractAddress,
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
  });

export interface TxReceipt {
  txId: string;
  blockHeight: number;
}

const receipt = (tx: FinalizedTxData): TxReceipt => ({ txId: tx.txId, blockHeight: Number(tx.blockHeight) });

/**
 * A holder's (or the issuer's) view of one CFT contract.
 *
 * Bookkeeping rules the OZ module imposes on wallets:
 *  - a fresh CSPRNG seed before every tx (`wit_RandomnessSeed`);
 *  - the plaintext of the current spendable ciphertext must be cached before
 *    any debit (`wit_PlaintextBalance`), so we sync first and update after.
 */
export class CftClient {
  constructor(
    readonly providers: CftProviders,
    readonly contract: DeployedCft,
  ) {}

  get address(): string {
    return this.contract.deployTxData.public.contractAddress;
  }

  async state(): Promise<CftPrivateState> {
    const s = await this.providers.privateStateProvider.get(PRIVATE_STATE_ID);
    if (!s) throw new Error('private state missing');
    return s;
  }

  async setState(s: CftPrivateState): Promise<void> {
    await this.providers.privateStateProvider.set(PRIVATE_STATE_ID, s);
  }

  async accountId(): Promise<string> {
    return toHex(accountIdFromSecretKey(fromHex((await this.state()).secretKeyHex)));
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
    return readAccount(await this.ledger(), await this.accountId());
  }

  /**
   * Registered / frozen flags and both balances. Pending comes exactly from
   * the memos; spendable from the cache or the wallet's own expected values,
   * else bounded recovery, else `undefined`.
   */
  async balances(): Promise<{
    spendable: bigint | undefined;
    pending: bigint | undefined;
    spendableSource: BalanceSource;
    pendingSource: BalanceSource;
    frozen: boolean;
    registered: boolean;
  }> {
    const view = await this.view();
    let s = await this.state();
    const pe = resolvePending(view, s.encryptionKeyHex);
    const sp = resolveSpendable(view, s.encryptionKeyHex, s);
    if (view.spendableCt && sp.value !== undefined) s = CftPrivateState.cachePlaintext(s, view.spendableCt, sp.value);
    if (view.pendingCt && pe.value !== undefined) s = CftPrivateState.cachePlaintext(s, view.pendingCt, pe.value);
    await this.setState(s);
    return {
      spendable: sp.value,
      pending: pe.value,
      spendableSource: sp.source,
      pendingSource: pe.source,
      frozen: view.frozen,
      registered: view.registered,
    };
  }

  /** Holder-supplied balance, accepted only if it verifies against the current ciphertext. */
  async setKnownSpendable(value: bigint): Promise<void> {
    const view = await this.view();
    if (!view.spendableCt) throw new Error('account not registered');
    const s = await this.state();
    if (!verifyBalance(view.spendableCt, fromHex(s.encryptionKeyHex), value)) throw new Error('claimed balance does not verify');
    await this.setState(CftPrivateState.cachePlaintext(s, view.spendableCt, value));
  }

  async memos(): Promise<bigint[]> {
    const s = await this.state();
    return memoHistory(await this.view(), s.encryptionKeyHex);
  }

  exportViewingKey = async (): Promise<ViewingKeyExport> => ({
    accountId: await this.accountId(),
    viewingKey: (await this.state()).encryptionKeyHex,
  });

  private async rotateSeed(): Promise<void> {
    await this.setState(CftPrivateState.withFreshSeed(await this.state()));
  }

  /** Debits and sweeps need a known spendable; remember what it will become. */
  private async prepareSpend(delta: (spendable: bigint, pending: bigint) => bigint): Promise<void> {
    const b = await this.balances();
    if (b.spendable === undefined) throw new Error('spendable balance unknown; call setKnownSpendable');
    if (b.pending === undefined) throw new Error('pending balance could not be resolved from memos');
    await this.setState(CftPrivateState.withSpendableCandidate(await this.state(), delta(b.spendable, b.pending)));
    await this.rotateSeed();
  }

  async register(): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.register()).public);
  }

  /** Issuer: store the holder's viewing key (collected at KYC) and allowlist the account. */
  async onboard(vk: ViewingKeyExport): Promise<TxReceipt> {
    await this.setState(CftPrivateState.withViewingKey(await this.state(), vk.accountId, vk.viewingKey));
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setOnboarded(fromHex(vk.accountId), true)).public);
  }

  async offboard(accountId: string): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setOnboarded(fromHex(accountId), false)).public);
  }

  async storedViewingKey(accountId: string): Promise<ViewingKeyExport | undefined> {
    const ek = (await this.state()).viewingKeys[accountId.toLowerCase()];
    return ek ? { accountId: accountId.toLowerCase(), viewingKey: ek } : undefined;
  }

  async sweep(): Promise<TxReceipt> {
    await this.prepareSpend((sp, pe) => sp + pe);
    return receipt((await this.contract.callTx.sweep()).public);
  }

  async transfer(toAccountId: string, value: bigint): Promise<TxReceipt> {
    await this.prepareSpend((sp) => sp - value);
    return receipt((await this.contract.callTx.transfer(fromHex(toAccountId), value)).public);
  }

  async burn(value: bigint): Promise<TxReceipt> {
    await this.prepareSpend((sp) => sp - value);
    return receipt((await this.contract.callTx.burn(value)).public);
  }

  // ── Issuer ───────────────────────────────────────────────────────────────

  async mint(toAccountId: string, value: bigint): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.mint(fromHex(toAccountId), value)).public);
  }

  async freeze(accountId: string): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setFrozen(fromHex(accountId), true)).public);
  }

  async unfreeze(accountId: string): Promise<TxReceipt> {
    await this.rotateSeed();
    return receipt((await this.contract.callTx.setFrozen(fromHex(accountId), false)).public);
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
   * Viewer: with a holder's viewing key, read their memo history and balances.
   * Pending is exact (memos); spendable by bounded recovery, or a holder-
   * claimed value verified against the ciphertext.
   */
  async inspect(vk: ViewingKeyExport, claimedSpendable?: bigint): Promise<{
    view: AccountView;
    memos: bigint[];
    spendable: bigint | undefined;
    pending: bigint | undefined;
    total: bigint | undefined;
  }> {
    const view = readAccount(await this.ledger(), vk.accountId);
    const memos = view.registered ? memoHistory(view, vk.viewingKey) : [];
    const pending = resolvePending(view, vk.viewingKey).value;
    let spendable = resolveSpendable(view, vk.viewingKey).value;
    if (spendable === undefined && claimedSpendable !== undefined && view.spendableCt) {
      if (verifyBalance(view.spendableCt, fromHex(vk.viewingKey), claimedSpendable)) spendable = claimedSpendable;
    }
    const total = spendable !== undefined && pending !== undefined ? spendable + pending : undefined;
    return { view, memos, spendable, pending, total };
  }

  /** Import a holder's viewing key and prove-and-seize their whole balance to `toAccountId`. */
  async seize(vk: ViewingKeyExport, toAccountId: string, claimedSpendable?: bigint): Promise<TxReceipt & { amount: bigint }> {
    const { view, total } = await this.inspect(vk, claimedSpendable);
    if (!view.spendableCt || !view.pendingCt) throw new Error('account not registered');
    if (total === undefined) throw new Error('could not recover the balance with this viewing key');
    const totalCt = addCiphertexts(view.spendableCt, view.pendingCt);
    let s = await this.state();
    s = CftPrivateState.withViewingKey(s, vk.accountId, vk.viewingKey);
    s = CftPrivateState.withViewedBalance(s, totalCt, total);
    await this.setState(s);
    await this.rotateSeed();
    const tx = await this.contract.callTx.seize(fromHex(vk.accountId), fromHex(toAccountId));
    return { ...receipt(tx.public), amount: total };
  }
}
