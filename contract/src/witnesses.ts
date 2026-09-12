// Witnesses and private state for the CFT demo.
//
// The OZ module's witness contract (see the header of
// oz/token/ConfidentialFungibleToken.compact):
//
//   wit_ConfidentialTokenSK  account secret; accountId = persistentHash(SK)
//   wit_ConfidentialTokenEK  ElGamal secret (the viewing key)
//   wit_PlaintextBalance(ct) the wallet's cached plaintext for `ct`
//   wit_RandomnessSeed       32 fresh, secret bytes per invocation
//   wit_OwnableSK            issuer identity (we reuse SK, so the issuer's
//                            Ownable id equals its CFT accountId)
//   wit_ViewingKey(account)  a holder's EK the issuer holds (seize only)
//   wit_ViewedBalance(ct)    the amount the issuer recovered for `ct` (seize)
//
// Private state is plain JSON (hex strings, decimal strings) so it can be
// exported, imported and persisted by any private-state provider.
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { ElGamal_Ciphertext, Ledger, Witnesses } from './managed/cft-demo/contract/index.js';
import { ctKey, fromHex, isZeroCiphertext, randomBytes32, toHex } from './crypto.js';

export type CftPrivateState = {
  /** 32-byte account secret (hex). Identity for CFT and, for the issuer, Ownable. */
  readonly secretKeyHex: string;
  /** 32-byte ElGamal secret (hex): the viewing key. Decrypts, cannot spend. */
  readonly encryptionKeyHex: string;
  /** Seed for this invocation's randomness. Rotated by the app before every tx. */
  readonly randomnessSeedHex?: string;
  /** ciphertext key -> plaintext (decimal string). */
  readonly plaintextCache: Record<string, string>;
  /** Issuer only: accountId (hex) -> viewing key (hex) disclosed by holders. */
  readonly viewingKeys: Record<string, string>;
  /** Issuer only: ciphertext key -> amount recovered with a viewing key. */
  readonly viewedBalances: Record<string, string>;
  /**
   * Expected spendable plaintexts after our own recent debits / sweeps, not yet
   * matched to a ciphertext (the indexer may lag). Checked with `verifyBalance`
   * on the next sync, so the wallet never needs discrete log for its own moves.
   */
  readonly spendableCandidates?: string[];
};

export const CftPrivateState = {
  generate: (): CftPrivateState => ({
    secretKeyHex: toHex(randomBytes32()),
    encryptionKeyHex: toHex(randomBytes32()),
    plaintextCache: {},
    viewingKeys: {},
    viewedBalances: {},
  }),

  fromSecrets: (secretKeyHex: string, encryptionKeyHex: string): CftPrivateState => ({
    secretKeyHex,
    encryptionKeyHex,
    plaintextCache: {},
    viewingKeys: {},
    viewedBalances: {},
  }),

  /** Fresh 32-byte CSPRNG seed. Call before every transaction. */
  withFreshSeed: (s: CftPrivateState): CftPrivateState => ({
    ...s,
    randomnessSeedHex: toHex(randomBytes32()),
  }),

  cachePlaintext: (s: CftPrivateState, ct: ElGamal_Ciphertext, value: bigint): CftPrivateState => ({
    ...s,
    plaintextCache: { ...s.plaintextCache, [ctKey(ct)]: value.toString() },
  }),

  lookupPlaintext: (s: CftPrivateState, ct: ElGamal_Ciphertext): bigint | undefined => {
    if (isZeroCiphertext(ct)) return 0n;
    const v = s.plaintextCache[ctKey(ct)];
    return v === undefined ? undefined : BigInt(v);
  },

  /** Remember an expected spendable value (bounded list, newest first). */
  withSpendableCandidate: (s: CftPrivateState, value: bigint): CftPrivateState => ({
    ...s,
    spendableCandidates: [value.toString(), ...(s.spendableCandidates ?? []).filter((v) => v !== value.toString())].slice(0, 16),
  }),

  withViewingKey: (s: CftPrivateState, accountIdHex: string, ekHex: string): CftPrivateState => ({
    ...s,
    viewingKeys: { ...s.viewingKeys, [accountIdHex.toLowerCase()]: ekHex.toLowerCase() },
  }),

  withViewedBalance: (s: CftPrivateState, ct: ElGamal_Ciphertext, amount: bigint): CftPrivateState => ({
    ...s,
    viewedBalances: { ...s.viewedBalances, [ctKey(ct)]: amount.toString() },
  }),
};

type Ctx = WitnessContext<Ledger, CftPrivateState>;

export const witnesses: Witnesses<CftPrivateState> = {
  wit_ConfidentialTokenSK({ privateState }: Ctx): [CftPrivateState, Uint8Array] {
    return [privateState, fromHex(privateState.secretKeyHex)];
  },

  wit_ConfidentialTokenEK({ privateState }: Ctx): [CftPrivateState, Uint8Array] {
    return [privateState, fromHex(privateState.encryptionKeyHex)];
  },

  wit_OwnableSK({ privateState }: Ctx): [CftPrivateState, Uint8Array] {
    return [privateState, fromHex(privateState.secretKeyHex)];
  },

  wit_PlaintextBalance({ privateState }: Ctx, ct: ElGamal_Ciphertext): [CftPrivateState, bigint] {
    const v = CftPrivateState.lookupPlaintext(privateState, ct);
    if (v === undefined) {
      throw new Error(
        'wit_PlaintextBalance: no cached plaintext for the current balance ciphertext. ' +
          'Sync the account first (memo replay / balance recovery) so the wallet knows its balance.',
      );
    }
    return [privateState, v];
  },

  wit_RandomnessSeed({ privateState }: Ctx): [CftPrivateState, Uint8Array] {
    // Freshness is load-bearing for confidentiality (see module header). The
    // app rotates the seed before each tx; if it forgot, mint one here. The
    // seed is threaded through the returned state so every witness call within
    // the same invocation sees the same seed, as the module requires.
    if (privateState.randomnessSeedHex) return [privateState, fromHex(privateState.randomnessSeedHex)];
    const fresh = CftPrivateState.withFreshSeed(privateState);
    return [fresh, fromHex(fresh.randomnessSeedHex!)];
  },

  wit_ViewingKey({ privateState }: Ctx, account: Uint8Array): [CftPrivateState, Uint8Array] {
    const ek = privateState.viewingKeys[toHex(account)];
    if (!ek) throw new Error(`wit_ViewingKey: no viewing key imported for account ${toHex(account)}`);
    return [privateState, fromHex(ek)];
  },

  wit_ViewedBalance({ privateState }: Ctx, ct: ElGamal_Ciphertext): [CftPrivateState, bigint] {
    if (isZeroCiphertext(ct)) return [privateState, 0n];
    const v = privateState.viewedBalances[ctKey(ct)];
    if (v === undefined) {
      throw new Error('wit_ViewedBalance: balance not recovered for this ciphertext; run the viewer first');
    }
    return [privateState, BigInt(v)];
  },
};
