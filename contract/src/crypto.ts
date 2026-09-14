// Wallet-side cryptography for the CFT: hex helpers, ciphertext keys, memo
// decryption, and bounded discrete-log recovery of ElGamal balances.
//
// Everything that touches the curve goes through the contract's exported pure
// circuits (or compact-runtime's built-ins), so the wallet and the circuit can
// never disagree about the arithmetic.
import { ecMulGenerator, type JubjubPoint } from '@midnight-ntwrk/compact-runtime';
import { jubjub } from '@noble/curves/misc.js';
import {
  pureCircuits,
  type EcdhMask_Ciphertext,
  type ElGamal_Ciphertext,
} from './managed/cft-demo/contract/index.js';

export type { EcdhMask_Ciphertext, ElGamal_Ciphertext, JubjubPoint };

/** Order of the Jubjub prime-order subgroup (the scalar field). */
export const JUBJUB_SUBGROUP_ORDER =
  6554484396890773809930967563523245729705921265872317281365359162392183254199n;

// ── Bytes ──────────────────────────────────────────────────────────────────

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const fromHex = (hex: string): Uint8Array => {
  const clean = hex.trim().replace(/^0x/, '');
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) throw new Error('invalid hex');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
};

export const randomBytes32 = (): Uint8Array => {
  const b = new Uint8Array(32);
  globalThis.crypto.getRandomValues(b);
  return b;
};

export const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

// ── Points and ciphertexts ─────────────────────────────────────────────────

export const pointKey = (p: JubjubPoint): string => `${p.x.toString(16)}:${p.y.toString(16)}`;

/** Canonical cache key for a ciphertext (matches OZ's test witness serialization). */
export const ctKey = (ct: ElGamal_Ciphertext): string =>
  `${ct.c1.x.toString(16)}:${ct.c1.y.toString(16)}:${ct.c2.x.toString(16)}:${ct.c2.y.toString(16)}`;

export const identityPoint = (): JubjubPoint => ecMulGenerator(0n);

/** `ElGamal_encryptZero()` is the fixed (identity, identity) pair; it always decrypts to 0. */
export const isZeroCiphertext = (ct: ElGamal_Ciphertext): boolean => {
  const id = pointKey(identityPoint());
  return pointKey(ct.c1) === id && pointKey(ct.c2) === id;
};

export const accountIdFromSecretKey = (sk: Uint8Array): Uint8Array => pureCircuits.computeAccountId(sk);
export const derivePk = (ek: Uint8Array): JubjubPoint => pureCircuits.derivePk(ek);
export const addCiphertexts = (a: ElGamal_Ciphertext, b: ElGamal_Ciphertext): ElGamal_Ciphertext =>
  pureCircuits.addCiphertexts(a, b);

// ── Viewing scalars ────────────────────────────────────────────────────────
//
// The ElGamal secret EK is 32 random bytes; everything a viewer does uses the
// Jubjub scalar `s = secretToScalar(EK)` (a hash of EK). The scalar cannot be
// turned back into EK, and it does not need to be: it decrypts memos, opens
// balance ciphertexts and is what `register` escrows to the compliance key.
// "Viewing key" in the wallet API therefore means this scalar, as 32-byte hex.

/** `secretToScalar(EK)`: the viewing scalar behind an encryption secret. */
export const viewingScalar = (ek: Uint8Array): bigint => pureCircuits.viewingScalar(ek);

export const scalarToHex = (s: bigint): string => s.toString(16).padStart(64, '0');
export const hexToScalar = (hex: string): bigint => {
  const clean = hex.trim().replace(/^0x/, '');
  if (!/^[0-9a-fA-F]{1,64}$/.test(clean)) throw new Error('viewing key must be up to 32 bytes of hex');
  return BigInt(`0x${clean}`);
};

/** The public key a viewing scalar corresponds to (`g^s`). */
export const pkOfScalar = (s: bigint): JubjubPoint => ecMulGenerator(s);

/** Open an escrow entry with the compliance secret: the escrowed account's viewing scalar. */
export const openEscrow = (ct: EcdhMask_Ciphertext, complianceEk: Uint8Array): bigint => pureCircuits.openEscrow(ct, complianceEk);

/** Decrypt a credit memo with a viewing scalar: returns the exact delivered amount. */
export const decryptMemo = (memo: EcdhMask_Ciphertext, s: bigint): bigint => pureCircuits.decryptMemo(memo, s);

/** Decrypt an exponential-ElGamal ciphertext to the point g^value. */
export const decryptToPoint = (ct: ElGamal_Ciphertext, s: bigint): JubjubPoint => pureCircuits.decryptToPoint(ct, s);

/** g^value, the lifted encoding a balance ciphertext decrypts to. */
export const valuePoint = (value: bigint): JubjubPoint => pureCircuits.valuePoint(value);

/** True iff `ct` encrypts exactly `claimed` under the key behind scalar `s`. */
export const verifyBalance = (ct: ElGamal_Ciphertext, s: bigint, claimed: bigint): boolean =>
  pointKey(decryptToPoint(ct, s)) === pointKey(pureCircuits.valuePoint(claimed));

// ── Bounded discrete log (baby-step giant-step) ────────────────────────────

/**
 * Recovers `v` from `g^v` for `0 <= v < maxValue`. Balances are stored as
 * lifted ElGamal, so a holder or viewer who lost their plaintext cache (or an
 * auditor holding only the viewing key) recovers the balance this way. The
 * memo channel carries exact amounts without this bound; the bound only
 * matters for the accumulated balance ciphertext.
 *
 * The point arithmetic runs on @noble/curves' pure-JS Jubjub (same curve, same
 * generator: checked against compact-runtime's `ecMulGenerator`), which is
 * ~100x faster than round-tripping every addition through the runtime's WASM.
 * A baby table of 2^16 points is built once; values below 2^16 are found
 * instantly, larger values need up to maxValue / 2^16 giant steps.
 */
type NoblePoint = InstanceType<typeof jubjub.Point>;

const toNoble = (p: JubjubPoint): NoblePoint => jubjub.Point.fromAffine({ x: p.x, y: p.y });
const nobleKey = (p: NoblePoint): string => {
  const a = p.toAffine();
  return `${a.x.toString(16)}:${a.y.toString(16)}`;
};

export class DiscreteLog {
  private readonly babySteps: number;
  private table: Map<string, number> | undefined;
  private negGiant: NoblePoint | undefined;

  constructor(babySteps = 1 << 16) {
    this.babySteps = babySteps;
  }

  private ensureTable(): Map<string, number> {
    if (this.table) return this.table;
    const g = toNoble(ecMulGenerator(1n));
    const table = new Map<string, number>();
    let p = jubjub.Point.ZERO;
    for (let j = 0; j < this.babySteps; j++) {
      table.set(nobleKey(p), j);
      p = p.add(g);
    }
    this.table = table;
    this.negGiant = g.multiply(BigInt(this.babySteps)).negate();
    return table;
  }

  solve(target: JubjubPoint, maxValue: bigint = 1n << 32n): bigint | undefined {
    const table = this.ensureTable();
    const m = BigInt(this.babySteps);
    const giantSteps = Number((maxValue + m - 1n) / m);
    let gamma = toNoble(target);
    for (let i = 0; i < giantSteps; i++) {
      const j = table.get(nobleKey(gamma));
      if (j !== undefined) return BigInt(i) * m + BigInt(j);
      gamma = gamma.add(this.negGiant!);
    }
    return undefined;
  }
}

let sharedDlog: DiscreteLog | undefined;
export const discreteLog = (): DiscreteLog => (sharedDlog ??= new DiscreteLog());

/** Recover the plaintext balance of `ct` with viewing scalar `s` (bounded search). */
export const recoverBalance = (
  ct: ElGamal_Ciphertext,
  s: bigint,
  maxValue: bigint = 1n << 32n,
): bigint | undefined => {
  if (isZeroCiphertext(ct)) return 0n;
  return discreteLog().solve(decryptToPoint(ct, s), maxValue);
};

/** A uniformly random nonzero Jubjub scalar (for escrow ephemeral keys). */
export const randomEscrowScalar = (): bigint => {
  for (;;) {
    const s = BigInt(`0x${toHex(randomBytes32())}`) % JUBJUB_SUBGROUP_ORDER;
    if (s !== 0n) return s;
  }
};
