// Provider-agnostic wallet logic shared by the CLI and the web UI: read an
// account out of the public ledger, resolve encrypted balances, decrypt memo
// history, and format amounts.
import type { EcdhMask_Ciphertext, ElGamal_Ciphertext, Ledger } from './managed/cft-demo/contract/index.js';
import {
  bytesEqual,
  decryptMemo,
  decryptToPoint,
  fromHex,
  isZeroCiphertext,
  pointKey,
  recoverBalance,
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
  /** Accounts the issuer has onboarded (may register). */
  allowlist: string[];
  registered: number;
}

export interface AccountView {
  accountId: string;
  onboarded: boolean;
  registered: boolean;
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
  allowlist: [...ledger.allowlist].map(toHex),
  registered: Number(ledger.CFT__encryptionKeys.size()),
});

export const readAccount = (ledger: Ledger, accountIdHex: string): AccountView => {
  const id = fromHex(accountIdHex);
  const registered = ledger.CFT__encryptionKeys.member(id);
  return {
    accountId: accountIdHex,
    onboarded: ledger.allowlist.member(id),
    registered,
    frozen: ledger.frozen.member(id),
    spendableCt: registered && ledger.CFT__balances.member(id) ? ledger.CFT__balances.lookup(id) : undefined,
    pendingCt: registered && ledger.CFT__pending.member(id) ? ledger.CFT__pending.lookup(id) : undefined,
    memos: ledger.CFT__memos.member(id) ? [...ledger.CFT__memos.lookup(id)] : [],
  };
};

export const isIssuer = (ledger: Ledger, accountIdHex: string): boolean =>
  ledger.Ownable__owner.is_left && bytesEqual(ledger.Ownable__owner.left, fromHex(accountIdHex));

export type BalanceSource = 'cache' | 'zero' | 'memos' | 'candidate' | 'recovered' | 'unknown';

export interface ResolvedBalance {
  value: bigint | undefined;
  source: BalanceSource;
}

/** Bounded discrete-log fallback for a ciphertext the wallet has no other handle on. */
export const resolveBalance = (
  ct: ElGamal_Ciphertext | undefined,
  ekHex: string,
  state?: CftPrivateState,
  maxValue?: bigint,
): ResolvedBalance => {
  if (!ct) return { value: 0n, source: 'zero' };
  if (state) {
    const cached = CftPrivateState.lookupPlaintext(state, ct);
    if (cached !== undefined) return { value: cached, source: cached === 0n ? 'zero' : 'cache' };
  }
  const recovered = recoverBalance(ct, fromHex(ekHex), maxValue);
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
export const resolvePending = (view: AccountView, ekHex: string): ResolvedBalance => {
  const ct = view.pendingCt;
  if (!ct || isZeroCiphertext(ct)) return { value: 0n, source: 'zero' };
  const ek = fromHex(ekHex);
  const target = pointKey(decryptToPoint(ct, ek));
  const memoValues = view.memos.map((m) => decryptMemo(m, ek));
  let sum = 0n;
  for (let k = 0; k <= memoValues.length; k++) {
    if (pointKey(valuePoint(sum)) === target) return { value: sum, source: 'memos' };
    if (k < memoValues.length) sum += memoValues[k];
  }
  return resolveBalance(ct, ekHex);
};

/**
 * Spendable balance: the wallet cache, else one of the values the wallet
 * expected after its own recent moves (verified against the ciphertext), else
 * bounded recovery, else unknown (the holder can supply it, see `verifyBalance`).
 */
export const resolveSpendable = (view: AccountView, ekHex: string, state?: CftPrivateState): ResolvedBalance => {
  const ct = view.spendableCt;
  if (!ct || isZeroCiphertext(ct)) return { value: 0n, source: 'zero' };
  if (state) {
    const cached = CftPrivateState.lookupPlaintext(state, ct);
    if (cached !== undefined) return { value: cached, source: 'cache' };
    const ek = fromHex(ekHex);
    for (const c of state.spendableCandidates ?? []) {
      const v = BigInt(c);
      if (verifyBalance(ct, ek, v)) return { value: v, source: 'candidate' };
    }
  }
  return resolveBalance(ct, ekHex);
};

/** Decrypt every credit memo for the account with its viewing key (newest first). */
export const memoHistory = (view: AccountView, ekHex: string): bigint[] =>
  view.memos.map((m) => decryptMemo(m, fromHex(ekHex)));

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

/** Shareable viewing key: the account id and the ElGamal secret. */
export interface ViewingKeyExport {
  accountId: string;
  viewingKey: string;
}

export const exportViewingKey = (state: CftPrivateState, accountIdHex: string): string =>
  JSON.stringify({ accountId: accountIdHex, viewingKey: state.encryptionKeyHex } satisfies ViewingKeyExport);

export const parseViewingKey = (text: string): ViewingKeyExport => {
  const parsed = JSON.parse(text) as Partial<ViewingKeyExport>;
  if (!parsed.accountId || !parsed.viewingKey) throw new Error('viewing key must contain accountId and viewingKey');
  fromHex(parsed.accountId);
  if (fromHex(parsed.viewingKey).length !== 32) throw new Error('viewing key must be 32 bytes');
  return { accountId: parsed.accountId.toLowerCase(), viewingKey: parsed.viewingKey.toLowerCase() };
};
