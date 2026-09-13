// Witnesses and private state for the note-model token (cft-note.compact).
//
// Witness contract (from the OZ modules):
//   wit_SecretKey          spend secret; pk = Hf(sk)
//   wit_InputNote          the ONE note being spent (or, for seize, the target)
//   wit_Path(cm)           Merkle path of that note's commitment, read from the
//                          live ledger (indexer state must be rehashed first)
//   wit_IssuerSecret       issuer role (mint)
//   wit_AuthoritySecret    authority role (freeze / seize)
//   wit_*Randomness        fresh, secret 32 bytes on EVERY call
//
// The delivery secret (encSk) is not a witness: it is only used off-chain to
// open deliveries. Private state is plain JSON (hex strings).
import { CompactTypeBytes, CompactTypeVector, degradeToTransient, persistentHash, type WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger, Note, Witnesses } from '../managed/cft-note/contract/index.js';
import { fromHex, randomBytes32, toHex } from '../crypto.js';

export type NoteRoleSecrets = {
  readonly issuerSecretHex: string;
  readonly authoritySecretHex: string;
  /** Audit secret scalar (hex bigint); auditKey = g^auditSk. */
  readonly auditSecretHex: string;
  /** Supply-key secret (32 bytes hex); supplyKey = ElGamal derivePk(secret). */
  readonly supplySecretHex: string;
};

export type NotePrivateState = {
  /** 32-byte spend secret (hex). pk = Hf(sk). */
  readonly secretKeyHex: string;
  /** Delivery secret scalar (hex bigint). encPk = g^encSk. Doubles as the holder's viewing key. */
  readonly encSecretHex: string;
  /** Deployer only: role secrets. */
  readonly roles?: NoteRoleSecrets;
  /** The note the next spend / seize consumes; set by the wallet right before the call. */
  readonly inputNote?: { value: string; nonce: string };
};

const bytes32Vec = new CompactTypeVector(1, new CompactTypeBytes(32));

/** A uniformly random value that is a valid Jubjub scalar (< 2^248 < subgroup order). */
export const randomScalar = (): bigint => degradeToTransient(persistentHash(bytes32Vec, [randomBytes32()]));

export const bigToHex = (v: bigint): string => '0x' + v.toString(16);
export const hexToBig = (h: string): bigint => BigInt(h.startsWith('0x') ? h : '0x' + h);

export const NotePrivateState = {
  generate: (withRoles = false): NotePrivateState => ({
    secretKeyHex: toHex(randomBytes32()),
    encSecretHex: bigToHex(randomScalar()),
    roles: withRoles
      ? {
          issuerSecretHex: toHex(randomBytes32()),
          authoritySecretHex: toHex(randomBytes32()),
          auditSecretHex: bigToHex(randomScalar()),
          supplySecretHex: toHex(randomBytes32()),
        }
      : undefined,
  }),

  fromSecrets: (secretKeyHex: string, encSecretHex: string, roles?: NoteRoleSecrets): NotePrivateState => ({
    secretKeyHex,
    encSecretHex,
    roles,
  }),

  withInputNote: (s: NotePrivateState, note: Note): NotePrivateState => ({
    ...s,
    inputNote: { value: bigToHex(note.value), nonce: bigToHex(note.nonce) },
  }),

  clearInputNote: (s: NotePrivateState): NotePrivateState => ({ ...s, inputNote: undefined }),
};

type Ctx = WitnessContext<Ledger, NotePrivateState>;

const need = <T>(v: T | undefined, what: string): T => {
  if (v === undefined) throw new Error(what);
  return v;
};

export const noteWitnesses: Witnesses<NotePrivateState> = {
  wit_SecretKey({ privateState }: Ctx) {
    return [privateState, fromHex(privateState.secretKeyHex)];
  },

  wit_InputNote({ privateState }: Ctx) {
    const n = need(privateState.inputNote, 'wit_InputNote: no input note selected (call selectInput first)');
    return [privateState, { value: hexToBig(n.value), nonce: hexToBig(n.nonce) }];
  },

  wit_Path({ privateState, ledger }: Ctx, cm: Uint8Array) {
    const path = ledger._commitments.findPathForLeaf(cm);
    if (path === undefined) throw new Error('wit_Path: commitment not found in the tree (note not yet indexed, or not yours)');
    return [privateState, path];
  },

  wit_IssuerSecret({ privateState }: Ctx) {
    return [privateState, fromHex(need(privateState.roles, 'wit_IssuerSecret: this identity holds no issuer role').issuerSecretHex)];
  },

  wit_AuthoritySecret({ privateState }: Ctx) {
    return [privateState, fromHex(need(privateState.roles, 'wit_AuthoritySecret: this identity holds no authority role').authoritySecretHex)];
  },

  // Fresh, secret randomness on every call, as the modules require.
  wit_AuditRandomness({ privateState }: Ctx) {
    return [privateState, randomBytes32()];
  },
  wit_DeliveryRandomness({ privateState }: Ctx) {
    return [privateState, randomBytes32()];
  },
  wit_SupplyRandomness({ privateState }: Ctx) {
    return [privateState, randomBytes32()];
  },
};
