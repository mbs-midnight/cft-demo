// midnight-js wiring for the note-model token (cft-note.compact).
import path from 'node:path';
import { CompiledContract, type ProvableCircuitId } from '@midnight-ntwrk/compact-js';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { deployContract, findDeployedContract, type DeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import type { FinalizedTxData, MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import {
  CftNote,
  NotePrivateState,
  auditView,
  encPk,
  fromHex,
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
  noteWitnesses,
} from 'cft-demo-contract';
import type { Config } from './common/config.js';
import { createWalletAndMidnightProvider, type WalletContext } from './common/wallet.js';
import type { TxReceipt } from './api.js';

export type NoteContract = CftNote.Contract<NotePrivateState>;
export type NoteCircuits = ProvableCircuitId<NoteContract>;
export const NOTE_PRIVATE_STATE_ID = 'cftNotePrivateState';
export type NoteProviders = MidnightProviders<NoteCircuits, typeof NOTE_PRIVATE_STATE_ID, NotePrivateState>;
export type DeployedNote = DeployedContract<NoteContract> | FoundContract<NoteContract>;

const here = path.dirname(new URL(import.meta.url).pathname);
export const NOTE_ZK_PATH = path.resolve(here, '..', '..', 'contract', 'src', 'managed', 'cft-note');

export const noteCompiledContract = CompiledContract.make<NoteContract>('CftNote', CftNote.Contract).pipe(
  CompiledContract.withWitnesses(noteWitnesses),
  CompiledContract.withCompiledFileAssets(NOTE_ZK_PATH),
);

export const makeNoteProviders = async (config: Config, wallet: WalletContext, actor: string): Promise<NoteProviders> => {
  const zkConfigProvider = new NodeZkConfigProvider<NoteCircuits>(NOTE_ZK_PATH);
  const walletAndMidnight = await createWalletAndMidnightProvider(wallet);
  return {
    privateStateProvider: levelPrivateStateProvider({
      midnightDbName: path.resolve(here, '..', '.state', config.name, `note-${actor}`),
      privateStateStoreName: 'cft-note-private-state',
      privateStoragePasswordProvider: () => 'CftDemo-Pr1vate!State-2026',
      accountId: wallet.address,
    }),
    // The commitment tree needs rehashing after indexer decode (see bmt-rehash.ts).
    publicDataProvider: withMerkleTreeRehash(indexerPublicDataProvider(config.indexer, config.indexerWS)),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnight,
    midnightProvider: walletAndMidnight,
  };
};

export const deployNote = async (providers: NoteProviders, deployer: NotePrivateState): Promise<DeployedNote> => {
  if (!deployer.roles) throw new Error('deployer identity needs role secrets (NotePrivateState.generate(true))');
  const k = roleKeys(deployer.roles);
  return deployContract(providers, {
    compiledContract: noteCompiledContract,
    privateStateId: NOTE_PRIVATE_STATE_ID,
    initialPrivateState: deployer,
    args: [k.issuerPk, k.authorityPk, k.auditKey, k.supplyKey],
  });
};

export const joinNote = async (providers: NoteProviders, contractAddress: string, state: NotePrivateState): Promise<DeployedNote> =>
  findDeployedContract(providers, {
    contractAddress: contractAddress as ContractAddress,
    compiledContract: noteCompiledContract,
    privateStateId: NOTE_PRIVATE_STATE_ID,
    initialPrivateState: state,
  });

const receipt = (tx: FinalizedTxData): TxReceipt => ({ txId: tx.txId, blockHeight: Number(tx.blockHeight) });

export class NoteClient {
  constructor(
    readonly providers: NoteProviders,
    readonly contract: DeployedNote,
  ) {}

  get address(): string {
    return this.contract.deployTxData.public.contractAddress;
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

  async address_(): Promise<PaymentAddress> {
    return paymentAddress(await this.state());
  }

  async notes(): Promise<NoteWalletView> {
    return scanNotes(await this.ledger(), await this.state());
  }

  async mint(to: PaymentAddress, value: bigint): Promise<TxReceipt> {
    const a = parsePaymentAddress(JSON.stringify(to));
    return receipt((await this.contract.callTx.mint(a.pk, a.encPk, value)).public);
  }

  /** Pick one input note that covers `value`, then spend it. */
  private async withInput(value: bigint, decimals: number): Promise<void> {
    const view = await this.notes();
    const input = selectInputNote(view, value, decimals);
    await this.setState(NotePrivateState.withInputNote(await this.state(), input.note));
  }

  async transfer(to: PaymentAddress, value: bigint, decimals = 2): Promise<TxReceipt> {
    await this.withInput(value, decimals);
    const a = parsePaymentAddress(JSON.stringify(to));
    const me = encPk(await this.state());
    return receipt((await this.contract.callTx.transfer(a.pk, a.encPk, me, value)).public);
  }

  async burn(value: bigint, decimals = 2): Promise<TxReceipt> {
    await this.withInput(value, decimals);
    const me = encPk(await this.state());
    return receipt((await this.contract.callTx.burn(me, value)).public);
  }

  // ── Auditor / authority ─────────────────────────────────────────────────

  async audit(): Promise<AuditedNote[]> {
    const s = await this.state();
    if (!s.roles) throw new Error('not the auditor');
    return auditView(await this.ledger(), s.roles.auditSecretHex);
  }

  async setFrozen(nullifierHex: string, frozen: boolean): Promise<TxReceipt> {
    return receipt((await this.contract.callTx.setFrozen(fromHex(nullifierHex), frozen)).public);
  }

  async seize(target: AuditedNote, recovery: PaymentAddress): Promise<TxReceipt> {
    await this.setState(NotePrivateState.withInputNote(await this.state(), target.note));
    const a = parsePaymentAddress(JSON.stringify(recovery));
    return receipt((await this.contract.callTx.seize(BigInt(target.ownerPk), a.pk, a.encPk)).public);
  }
}
