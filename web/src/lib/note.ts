// Browser-side client for the note-model token (cft-note.compact).
import { CompiledContract, type ProvableCircuitId } from '@midnight-ntwrk/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { deployContract, findDeployedContract, type DeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { createProofProvider, type FinalizedTxData, type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { dappConnectorProvingProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import {
  CftNote,
  NotePrivateState,
  auditView,
  encPk,
  fromHex,
  isNoteAuditor,
  isNoteAuthority,
  isNoteIssuer,
  noteWitnesses,
  parsePaymentAddress,
  paymentAddress,
  readNoteToken,
  roleKeys,
  scanNotes,
  selectInputNote,
  withMerkleTreeRehash,
  type AuditedNote,
  type NoteLedger,
  type NoteTokenInfo,
  type NoteWalletView,
  type PaymentAddress,
} from 'cft-demo-contract';
import type { NetworkConfig } from './config.js';
import type { ProvingMode, TxReceipt } from './cft.js';
import { connectorProviders, type ConnectedWallet } from './wallet.js';

export type NoteContract = CftNote.Contract<NotePrivateState>;
export type NoteCircuits = ProvableCircuitId<NoteContract>;
export const NOTE_PRIVATE_STATE_ID = 'cftNotePrivateState';
export type NoteProviders = MidnightProviders<NoteCircuits, typeof NOTE_PRIVATE_STATE_ID, NotePrivateState>;
export type DeployedNote = DeployedContract<NoteContract> | FoundContract<NoteContract>;

const ZK_PATH = './contract/cft-note';

export const noteCompiledContract = CompiledContract.make<NoteContract>('CftNote', CftNote.Contract).pipe(
  CompiledContract.withWitnesses(noteWitnesses),
  CompiledContract.withCompiledFileAssets(ZK_PATH),
);

// ── Identity per wallet, kept in this browser ──────────────────────────────

const key = (walletAddress: string) => `cft-demo/note-identity/${walletAddress}`;

export const loadOrCreateNoteIdentity = (walletAddress: string): NotePrivateState => {
  try {
    const raw = localStorage.getItem(key(walletAddress));
    if (raw) {
      const p = JSON.parse(raw) as { secretKeyHex: string; encSecretHex: string; roles?: NotePrivateState['roles'] };
      return NotePrivateState.fromSecrets(p.secretKeyHex, p.encSecretHex, p.roles);
    }
  } catch {
    /* create below */
  }
  const fresh = NotePrivateState.generate(false);
  saveNoteIdentity(walletAddress, fresh);
  return fresh;
};

export const saveNoteIdentity = (walletAddress: string, s: NotePrivateState): void => {
  localStorage.setItem(key(walletAddress), JSON.stringify({ secretKeyHex: s.secretKeyHex, encSecretHex: s.encSecretHex, roles: s.roles }));
};

// ── Providers ──────────────────────────────────────────────────────────────

export const makeNoteProviders = async (
  wallet: ConnectedWallet,
  network: NetworkConfig,
  proving: ProvingMode,
  proofServerUrl: string,
): Promise<NoteProviders> => {
  const zkConfigProvider = new FetchZkConfigProvider<NoteCircuits>(`${window.location.origin}/${ZK_PATH.replace(/^\.\//, '')}`, fetch.bind(window));
  const walletAndMidnight = connectorProviders(wallet);
  if (proving === 'wallet' && !wallet.canProveInWallet) throw new Error(`${wallet.name} does not expose getProvingProvider`);
  const proofProvider =
    proving === 'wallet'
      ? createProofProvider(await dappConnectorProvingProvider(wallet.api, zkConfigProvider))
      : httpClientProofProvider(proofServerUrl, zkConfigProvider);
  return {
    privateStateProvider: levelPrivateStateProvider({
      midnightDbName: 'cft-demo-note',
      privateStateStoreName: 'cft-note-private-state',
      privateStoragePasswordProvider: () => 'CftDemo-Pr1vate!State-2026',
      accountId: wallet.unshieldedAddress,
    }),
    publicDataProvider: withMerkleTreeRehash(indexerPublicDataProvider(network.indexer, network.indexerWS)),
    zkConfigProvider,
    proofProvider,
    walletProvider: walletAndMidnight,
    midnightProvider: walletAndMidnight,
  };
};

export const deployNote = (providers: NoteProviders, deployer: NotePrivateState): Promise<DeployedNote> => {
  if (!deployer.roles) throw new Error('deployer identity needs role secrets');
  const k = roleKeys(deployer.roles);
  return deployContract(providers, {
    compiledContract: noteCompiledContract,
    privateStateId: NOTE_PRIVATE_STATE_ID,
    initialPrivateState: deployer,
    args: [k.issuerPk, k.authorityPk, k.auditKey, k.supplyKey],
  });
};

/** Join without clobbering stored private state (see cft.ts `join`). */
export const joinNote = async (providers: NoteProviders, contractAddress: string, state: NotePrivateState): Promise<DeployedNote> => {
  const address = contractAddress.trim() as ContractAddress;
  providers.privateStateProvider.setContractAddress(address);
  const stored = await providers.privateStateProvider.get(NOTE_PRIVATE_STATE_ID);
  return findDeployedContract(
    providers,
    stored
      ? { contractAddress: address, compiledContract: noteCompiledContract, privateStateId: NOTE_PRIVATE_STATE_ID }
      : { contractAddress: address, compiledContract: noteCompiledContract, privateStateId: NOTE_PRIVATE_STATE_ID, initialPrivateState: state },
  );
};

const receipt = (tx: FinalizedTxData): TxReceipt => ({ txId: tx.txId, blockHeight: Number(tx.blockHeight) });

export interface NoteRoles {
  issuer: boolean;
  authority: boolean;
  auditor: boolean;
}

export class NoteClient {
  constructor(
    readonly providers: NoteProviders,
    readonly contract: DeployedNote,
    readonly identity: NotePrivateState,
  ) {}

  static async attach(providers: NoteProviders, contract: DeployedNote, suggested: NotePrivateState): Promise<NoteClient> {
    const stored = await providers.privateStateProvider.get(NOTE_PRIVATE_STATE_ID);
    return new NoteClient(providers, contract, stored ?? suggested);
  }

  get address(): string {
    return this.contract.deployTxData.public.contractAddress;
  }

  get paymentAddress(): PaymentAddress {
    return paymentAddress(this.identity);
  }

  async state(): Promise<NotePrivateState> {
    const s = await this.providers.privateStateProvider.get(NOTE_PRIVATE_STATE_ID);
    if (!s) throw new Error('private state missing');
    return s;
  }

  async setState(s: NotePrivateState): Promise<void> {
    await this.providers.privateStateProvider.set(NOTE_PRIVATE_STATE_ID, s);
  }

  async ledger(): Promise<NoteLedger> {
    const cs = await this.providers.publicDataProvider.queryContractState(this.address as ContractAddress);
    if (!cs) throw new Error(`contract ${this.address} not found on chain`);
    return CftNote.ledger(cs.data);
  }

  async token(): Promise<NoteTokenInfo> {
    return readNoteToken(await this.ledger());
  }

  async roles(): Promise<NoteRoles> {
    const l = await this.ledger();
    const s = await this.state();
    return { issuer: isNoteIssuer(l, s), authority: isNoteAuthority(l, s), auditor: isNoteAuditor(l, s) };
  }

  async notes(): Promise<NoteWalletView> {
    return scanNotes(await this.ledger(), await this.state());
  }

  async mint(to: string, value: bigint): Promise<TxReceipt> {
    const a = parsePaymentAddress(to);
    return receipt((await this.contract.callTx.mint(a.pk, a.encPk, value)).public);
  }

  private async selectInput(value: bigint, decimals: number): Promise<void> {
    const input = selectInputNote(await this.notes(), value, decimals);
    await this.setState(NotePrivateState.withInputNote(await this.state(), input.note));
  }

  async transfer(to: string, value: bigint, decimals: number): Promise<TxReceipt> {
    await this.selectInput(value, decimals);
    const a = parsePaymentAddress(to);
    return receipt((await this.contract.callTx.transfer(a.pk, a.encPk, encPk(await this.state()), value)).public);
  }

  async burn(value: bigint, decimals: number): Promise<TxReceipt> {
    await this.selectInput(value, decimals);
    return receipt((await this.contract.callTx.burn(encPk(await this.state()), value)).public);
  }

  async audit(): Promise<AuditedNote[]> {
    const s = await this.state();
    if (!s.roles) throw new Error('this identity holds no audit key');
    return auditView(await this.ledger(), s.roles.auditSecretHex);
  }

  async setFrozen(nullifierHex: string, frozen: boolean): Promise<TxReceipt> {
    return receipt((await this.contract.callTx.setFrozen(fromHex(nullifierHex), frozen)).public);
  }

  async seize(target: AuditedNote, recovery: string): Promise<TxReceipt> {
    await this.setState(NotePrivateState.withInputNote(await this.state(), target.note));
    const a = parsePaymentAddress(recovery);
    return receipt((await this.contract.callTx.seize(BigInt(target.ownerPk), a.pk, a.encPk)).public);
  }
}

/** Which contract is at this address: account-model CFT, note-model, or something else. */
export const detectModel = async (network: NetworkConfig, contractAddress: string): Promise<'cft' | 'note' | 'unknown'> => {
  const pdp = withMerkleTreeRehash(indexerPublicDataProvider(network.indexer, network.indexerWS));
  const cs = await pdp.queryContractState(contractAddress.trim() as ContractAddress);
  if (!cs) throw new Error('no contract at this address on this network');
  try {
    const l = CftNote.ledger(cs.data);
    void l._issuerPk;
    void l._commitments.firstFree();
    return 'note';
  } catch {
    /* not a note token */
  }
  try {
    const { CftDemo } = await import('cft-demo-contract');
    void CftDemo.ledger(cs.data).CFT__name;
    return 'cft';
  } catch {
    return 'unknown';
  }
};
