// Provider-agnostic wallet logic shared by the CLI and the web UI: read an
// account out of the public ledger, resolve encrypted balances, decrypt memo
// history, and format amounts.
import type { EcdhMask_Ciphertext, ElGamal_Ciphertext, Ledger } from './managed/cft-demo/contract/index.js';
import {
  bytesEqual,
  decryptMemo,
  decryptToPoint,
  derivePk,
  fromHex,
  hexToScalar,
  isZeroCiphertext,
  openEscrow,
  pkOfScalar,
  pointKey,
  recoverBalance,
  scalarToHex,
  toHex,
  valuePoint,
  verifyBalance,
} from './crypto.js';
import { CftPrivateState } from './witnesses.js';

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  issuerAccountId: string;
  paused: boolean;
  frozen: string[];
  /** The public key every holder's viewing scalar is escrowed to (`x:y` hex). */
  complianceKey: string;
  registered: number;
  /** Every registered accountId (hex). Public: the ids are the ledger map keys. */
  accounts: string[];
  /** Accounts with an escrow entry (every account registered through this wrapper). */
  escrowed: number;
}

export interface AccountView {
  accountId: string;
  registered: boolean;
  /** The account's viewing scalar is on chain, encrypted to the compliance key. */
  escrowed: boolean;
  escrowCt: EcdhMask_Ciphertext | undefined;
  frozen: boolean;
  spendableCt: ElGamal_Ciphertext | undefined;
  pendingCt: ElGamal_Ciphertext | undefined;
  /** Newest first (the module uses pushFront). */
  memos: EcdhMask_Ciphertext[];
}

export const readToken = (ledger: Ledger): TokenInfo => ({
  name: ledger.CFT__name,
  symbol: ledger.CFT__symbol,
  decimals: Number(ledger.CFT__decimals),
  totalSupply: ledger.Supply__totalSupply,
  issuerAccountId: toHex(ledger.Ownable__owner.left),
  paused: ledger.paused,
  frozen: [...ledger.frozen].map(toHex),
  complianceKey: pointKey(ledger.complianceKey),
  registered: Number(ledger.CFT__encryptionKeys.size()),
  accounts: registeredAccounts(ledger),
  escrowed: Number(ledger.escrow.size()),
});

/** Every registered accountId (hex). */
export const registeredAccounts = (ledger: Ledger): string[] => [...ledger.CFT__encryptionKeys].map(([id]) => toHex(id));

export const readAccount = (ledger: Ledger, accountIdHex: string): AccountView => {
  const id = fromHex(accountIdHex);
  const registered = ledger.CFT__encryptionKeys.member(id);
  const escrowed = ledger.escrow.member(id);
  return {
    accountId: accountIdHex,
    registered,
    escrowed,
    escrowCt: escrowed ? ledger.escrow.lookup(id) : undefined,
    frozen: ledger.frozen.member(id),
    spendableCt: registered && ledger.CFT__balances.member(id) ? ledger.CFT__balances.lookup(id) : undefined,
    pendingCt: registered && ledger.CFT__pending.member(id) ? ledger.CFT__pending.lookup(id) : undefined,
    memos: ledger.CFT__memos.member(id) ? [...ledger.CFT__memos.lookup(id)] : [],
  };
};

export const isIssuer = (ledger: Ledger, accountIdHex: string): boolean =>
  ledger.Ownable__owner.is_left && bytesEqual(ledger.Ownable__owner.left, fromHex(accountIdHex));

/** Does this encryption secret (EK) hold the compliance key the escrows are encrypted to? */
export const holdsComplianceKey = (ledger: Ledger, ekHex: string): boolean =>
  pointKey(derivePk(fromHex(ekHex))) === pointKey(ledger.complianceKey);

/**
 * Open an account's escrow with the compliance secret. Returns the viewing
 * scalar (hex) if the account is registered and escrowed and the opened scalar
 * really is the one behind its registered encryption key; a wrong compliance
 * key opens to garbage and yields `undefined`.
 */
export const openEscrowedKey = (ledger: Ledger, accountIdHex: string, complianceEkHex: string): string | undefined => {
  const id = fromHex(accountIdHex);
  if (!ledger.escrow.member(id) || !ledger.CFT__encryptionKeys.member(id)) return undefined;
  const s = openEscrow(ledger.escrow.lookup(id), fromHex(complianceEkHex));
  if (pointKey(pkOfScalar(s)) !== pointKey(ledger.CFT__encryptionKeys.lookup(id))) return undefined;
  return scalarToHex(s);
};

export type BalanceSource = 'cache' | 'zero' | 'memos' | 'candidate' | 'recovered' | 'unknown';

/** Amounts are Uint<128>; a memo opened with the wrong key decrypts to a random field element far outside that. */
const MAX_AMOUNT = (1n << 128n) - 1n;
const isAmount = (v: bigint): boolean => v >= 0n && v <= MAX_AMOUNT;

export interface ResolvedBalance {
  value: bigint | undefined;
  source: BalanceSource;
}

/** Bounded discrete-log fallback for a ciphertext the wallet has no other handle on. */
export const resolveBalance = (
  ct: ElGamal_Ciphertext | undefined,
  viewingKeyHex: string,
  state?: CftPrivateState,
  maxValue?: bigint,
): ResolvedBalance => {
  if (!ct) return { value: 0n, source: 'zero' };
  if (state) {
    const cached = CftPrivateState.lookupPlaintext(state, ct);
    if (cached !== undefined) return { value: cached, source: cached === 0n ? 'zero' : 'cache' };
  }
  const recovered = recoverBalance(ct, hexToScalar(viewingKeyHex), maxValue);
  if (recovered === undefined) return { value: undefined, source: 'unknown' };
  return { value: recovered, source: recovered === 0n ? 'zero' : 'recovered' };
};

/**
 * Pending balance from the memo channel, exactly and for any amount.
 *
 * `pending` only ever changes by credits (each leaves a memo, newest first) or
 * by a reset to zero (sweep, seize). So its plaintext is always the sum of the
 * newest k memos for some k; try k = 0..n and accept the one whose g^sum equals
 * the decrypted point. No cache, no bound.
 */
export const resolvePending = (view: AccountView, viewingKeyHex: string): ResolvedBalance => {
  const ct = view.pendingCt;
  if (!ct || isZeroCiphertext(ct)) return { value: 0n, source: 'zero' };
  const s = hexToScalar(viewingKeyHex);
  const target = pointKey(decryptToPoint(ct, s));
  const memoValues = view.memos.map((m) => decryptMemo(m, s));
  // A wrong viewing key opens memos to garbage; do not feed that to the circuit helpers.
  if (memoValues.every(isAmount)) {
    let sum = 0n;
    for (let k = 0; k <= memoValues.length; k++) {
      if (!isAmount(sum)) break;
      if (pointKey(valuePoint(sum)) === target) return { value: sum, source: 'memos' };
      if (k < memoValues.length) sum += memoValues[k];
    }
  }
  return resolveBalance(ct, viewingKeyHex);
};

/**
 * Spendable balance: the wallet cache, else one of the values the wallet
 * expected after its own recent moves (verified against the ciphertext), else
 * bounded recovery, else unknown (the holder can supply it, see `verifyBalance`).
 */
export const resolveSpendable = (view: AccountView, viewingKeyHex: string, state?: CftPrivateState): ResolvedBalance => {
  const ct = view.spendableCt;
  if (!ct || isZeroCiphertext(ct)) return { value: 0n, source: 'zero' };
  const s = hexToScalar(viewingKeyHex);
  if (state) {
    const cached = CftPrivateState.lookupPlaintext(state, ct);
    if (cached !== undefined) return { value: cached, source: 'cache' };
    for (const c of state.spendableCandidates ?? []) {
      const v = BigInt(c);
      if (verifyBalance(ct, s, v)) return { value: v, source: 'candidate' };
    }
  }
  // An account that has swept everything it received and never spent holds
  // exactly the sum of its memos, which are readable with no bound. Try that
  // (and the sum minus the newest credit, for a credit still pending) before
  // falling back to bounded recovery.
  const memoValues = view.memos.map((m) => decryptMemo(m, s));
  const total = memoValues.reduce((a, v) => a + v, 0n);
  for (const candidate of [total, total - (memoValues[0] ?? 0n)]) {
    if (candidate > 0n && isAmount(candidate) && verifyBalance(ct, s, candidate)) return { value: candidate, source: 'memos' };
  }
  return resolveBalance(ct, viewingKeyHex);
};

/** Decrypt every credit memo for the account with its viewing key (newest first). */
export const memoHistory = (view: AccountView, viewingKeyHex: string): bigint[] => {
  const s = hexToScalar(viewingKeyHex);
  return view.memos.map((m) => decryptMemo(m, s));
};

// ── Amount formatting ──────────────────────────────────────────────────────

export const formatAmount = (units: bigint, decimals: number): string => {
  if (decimals === 0) return units.toString();
  const s = units.toString().padStart(decimals + 1, '0');
  const whole = s.slice(0, -decimals);
  const frac = s.slice(-decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
};

export const parseAmount = (text: string, decimals: number): bigint => {
  const m = text.trim().match(/^(\d+)(?:\.(\d+))?$/);
  if (!m) throw new Error(`invalid amount '${text}'`);
  const frac = (m[2] ?? '').padEnd(decimals, '0');
  if (frac.length > decimals) throw new Error(`too many decimals (max ${decimals})`);
  return BigInt(m[1]) * 10n ** BigInt(decimals) + BigInt(frac || '0');
};

/**
 * Shareable viewing key: the account id and its viewing scalar (hex). Reads
 * memos and balances, cannot spend. The same value is what the escrow holds.
 */
export interface ViewingKeyExport {
  accountId: string;
  viewingKey: string;
}

export const exportViewingKey = (state: CftPrivateState, accountIdHex: string): string =>
  JSON.stringify({ accountId: accountIdHex, viewingKey: CftPrivateState.viewingKeyHex(state) } satisfies ViewingKeyExport);

export const parseViewingKey = (text: string): ViewingKeyExport => {
  const parsed = JSON.parse(text) as Partial<ViewingKeyExport>;
  if (!parsed.accountId || !parsed.viewingKey) throw new Error('viewing key must contain accountId and viewingKey');
  if (fromHex(parsed.accountId).length !== 32) throw new Error('accountId must be 32 bytes');
  return { accountId: parsed.accountId.toLowerCase(), viewingKey: scalarToHex(hexToScalar(parsed.viewingKey)) };
};
