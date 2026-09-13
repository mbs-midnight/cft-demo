// "What the chain sees": build the public view of a transaction or an account
// from real chain data (indexer + the on-chain transcript), and the private
// view from whatever viewing keys this browser holds. Used by the observer
// panel to show, side by side, what an explorer can display and what only a
// viewing-key holder can read.
import { Transaction } from '@midnight-ntwrk/ledger-v8';
import {
  decryptMemo,
  formatAmount,
  fromHex,
  isZeroCiphertext,
  readAccount,
  resolvePending,
  resolveSpendable,
  toHex,
  type ElGamal_Ciphertext,
  type Ledger,
  type ViewingKeyExport,
} from 'cft-demo-contract';

export interface ObservedRow {
  label: string;
  /** What any explorer / indexer user can see. */
  publicValue: string;
  /** What the holder of the relevant viewing key sees. */
  privateValue: string;
  /** Is the private column strictly more informative than the public one? */
  hidden: boolean;
}

export interface ObservedTx {
  hash: string;
  rows: ObservedRow[];
}

const hexb = (h: string) => Uint8Array.from(h.match(/.{2}/g)!.map((x) => parseInt(x, 16)));
const short = (s: string, n = 8) => (s.length > 2 * n ? `${s.slice(0, n)}…${s.slice(-n)}` : s);

/** A ciphertext as an explorer would render it: opaque curve points. */
export const redactedCiphertext = (ct: ElGamal_Ciphertext): string =>
  isZeroCiphertext(ct)
    ? 'the fixed Enc(0): publicly recognisable as an empty balance'
    : `(${short(ct.c1.x.toString(16), 6)}, ${short(ct.c2.x.toString(16), 6)}) · 2 Jubjub points, opaque`;

const gql = async (indexer: string, query: string, variables: Record<string, unknown>) => {
  const r = await fetch(indexer, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = (await r.json()) as { data?: any; errors?: { message: string }[] };
  if (j.errors?.length) throw new Error(j.errors[0].message);
  return j.data;
};

// midnight-js reports a tx *identifier* (66 hex chars); explorers show the
// 32-byte *hash* (64 hex chars). The indexer accepts either as an offset.
const TX_QUERY = (byIdentifier: boolean) => `query($hash: HexEncoded!) {
  transactions(offset: { ${byIdentifier ? 'identifier' : 'hash'}: $hash }) {
    hash
    block { height timestamp }
    ... on RegularTransaction {
      fee
      raw
      contractActions { __typename address ... on ContractCall { entryPoint } }
    }
  }
}`;

export interface PublicTx {
  hash: string;
  blockHeight: number;
  /** Entry points called on `contractAddress` (or a description if none). */
  circuit: string;
  entryPoints: string[];
  feeText: string;
  /** The transaction's own printed form (transcript included), if parseable. */
  transcript?: string;
}

/** Everything an explorer has about a transaction: indexer fields plus the transaction bytes. */
export const fetchPublicTx = async (indexer: string, hash: string, contractAddress: string): Promise<PublicTx> => {
  const clean = hash.trim().replace(/^0x/, '').toLowerCase();
  const data = await gql(indexer, TX_QUERY(clean.length !== 64), { hash: clean });
  const tx = (data?.transactions ?? [])[0];
  if (!tx) throw new Error('transaction not found (not indexed yet? try again in a few seconds)');
  const actions: { __typename: string; address: string; entryPoint?: string }[] = tx.contractActions ?? [];
  const ours = actions.filter((a) => a.address === contractAddress);
  const entryPoints = ours.map((a) => a.entryPoint ?? a.__typename.replace('Contract', '').toLowerCase());
  const circuit = entryPoints.join(', ') || (actions.length ? 'other contract' : 'no contract call');
  let feeText = 'unknown';
  let transcript: string | undefined;
  try {
    const t = Transaction.deserialize('signature', 'proof', 'binding', hexb(tx.raw));
    transcript = t.toString(true);
    const v = transcript.match(/v_fee: (\d+)/);
    if (v) feeText = `${formatAmount(BigInt(v[1]), 15)} DUST (paid by the wallet)`;
  } catch {
    /* keep indexer data only */
  }
  if (feeText === 'unknown') {
    const feeRaw = typeof tx.fee === 'string' ? tx.fee : tx.fee?.paidFees;
    if (feeRaw && /^\d+$/.test(String(feeRaw))) feeText = `${formatAmount(BigInt(feeRaw), 15)} DUST (paid by the wallet)`;
  }
  return { hash: tx.hash, blockHeight: Number(tx.block.height), circuit, entryPoints, feeText, transcript };
};

export interface KeyRing {
  /** accountId -> viewing key hex, for every account this browser can read. */
  keys: Record<string, string>;
  /** Names for known ids (e.g. "you", "issuer"). */
  names: Record<string, string>;
}

const nameOf = (ring: KeyRing, id: string) => (ring.names[id] ? `${ring.names[id]} ${short(id)}` : short(id));

/**
 * Public view: everything below comes from the indexer and the transaction's
 * own bytes (its on-chain transcript), which is exactly what an explorer has.
 * Private view: decrypts with the viewing keys in `ring`.
 */
export const observeTransaction = async (
  indexer: string,
  hash: string,
  ledger: Ledger,
  contractAddress: string,
  decimals: number,
  symbol: string,
  ring: KeyRing,
): Promise<ObservedTx> => {
  const tx = await fetchPublicTx(indexer, hash, contractAddress);
  const entryPoints = tx.entryPoints;
  // Parties: 32-byte values the transcript pushes that are registered accounts.
  const registered = new Set<string>([...ledger.CFT__encryptionKeys].map(([id]) => toHex(id)));
  const parties = tx.transcript
    ? [...new Set([...tx.transcript.matchAll(/<\[([0-9a-f]{64})\]: b32>/g)].map((m) => m[1]))].filter((id) => registered.has(id))
    : [];
  const feeText = tx.feeText;
  const circuit = tx.circuit;

  const rows: ObservedRow[] = [
    { label: 'Transaction', publicValue: `${short(tx.hash, 10)} · block ${tx.blockHeight}`, privateValue: 'same', hidden: false },
    { label: 'Contract', publicValue: short(contractAddress, 10), privateValue: 'same', hidden: false },
    { label: 'Circuit called', publicValue: circuit, privateValue: 'same', hidden: false },
    { label: 'Fee', publicValue: feeText, privateValue: 'same', hidden: false },
  ];

  const partyText = parties.length ? parties.map((p) => nameOf(ring, p)).join(' → ') : 'none referenced';
  rows.push({ label: 'Accounts involved', publicValue: partyText, privateValue: 'same', hidden: false });

  const ep = entryPoints[0];
  if (ep === 'transfer' || ep === 'mint' || ep === 'seize') {
    // The recipient is the last account the transcript references; its newest
    // memo carries this credit (or a later one, if more credits arrived since).
    const recipientId = parties[parties.length - 1];
    let priv = 'needs the recipient viewing key';
    if (recipientId && ring.keys[recipientId]) {
      const view = readAccount(ledger, recipientId);
      if (view.memos.length) {
        const amount = decryptMemo(view.memos[0], fromHex(ring.keys[recipientId]));
        priv = `${formatAmount(amount, decimals)} ${symbol} (decrypted from ${nameOf(ring, recipientId)}'s most recent credit memo)`;
      }
    }
    const publicAmount =
      ep === 'mint'
        ? 'not in the tx, but revealed by the totalSupply increase'
        : ep === 'seize'
          ? 'hidden: encrypted memo + re-encrypted balances'
          : 'hidden: only new ciphertexts and an encrypted memo are written';
    rows.push({ label: 'Amount', publicValue: publicAmount, privateValue: priv, hidden: ep !== 'mint' });
    const recipient = parties[parties.length - 1];
    if (recipient && ledger.CFT__pending.member(fromHex(recipient))) {
      rows.push({
        label: `${nameOf(ring, recipient)} pending balance after`,
        publicValue: redactedCiphertext(ledger.CFT__pending.lookup(fromHex(recipient))),
        privateValue: ring.keys[recipient]
          ? `${formatAmount(resolvePending(readAccount(ledger, recipient), ring.keys[recipient]).value ?? 0n, decimals)} ${symbol}`
          : 'needs viewing key',
        hidden: true,
      });
    }
  } else if (ep === 'burn') {
    rows.push({
      label: 'Amount',
      publicValue: 'not in the tx, but revealed by the totalSupply decrease',
      privateValue: 'same (the burner also knows its new balance)',
      hidden: false,
    });
  } else if (ep === 'setFrozen' || ep === 'setOnboarded' || ep === 'setPaused') {
    rows.push({ label: 'Effect', publicValue: 'compliance flag change, fully public', privateValue: 'same', hidden: false });
  } else if (ep === 'register') {
    rows.push({ label: 'Effect', publicValue: 'encryption public key registered; balance set to Enc(0)', privateValue: 'same', hidden: false });
  } else if (ep === 'sweep') {
    rows.push({ label: 'Effect', publicValue: 'pending ciphertext folded into spendable ciphertext; amounts hidden', privateValue: 'same', hidden: false });
  }
  rows.push({ label: 'Public total supply', publicValue: `${formatAmount(ledger.Supply__totalSupply, decimals)} ${symbol}`, privateValue: 'same', hidden: false });
  return { hash: tx.hash, rows };
};

export const observeAccount = (
  ledger: Ledger,
  accountId: string,
  decimals: number,
  symbol: string,
  ring: KeyRing,
  vk?: ViewingKeyExport,
): ObservedRow[] => {
  const view = readAccount(ledger, accountId);
  const key = vk?.accountId === accountId ? vk.viewingKey : ring.keys[accountId];
  const rows: ObservedRow[] = [
    { label: 'accountId', publicValue: short(accountId, 10), privateValue: 'same', hidden: false },
    {
      label: 'Status',
      publicValue: [view.onboarded ? 'onboarded' : 'not onboarded', view.registered ? 'registered' : 'not registered', view.frozen ? 'FROZEN' : 'active'].join(' · '),
      privateValue: 'same',
      hidden: false,
    },
    { label: 'Credits received', publicValue: `${view.memos.length} memo(s), contents encrypted`, privateValue: key ? view.memos.map((m) => `+${formatAmount(decryptMemo(m, fromHex(key)), decimals)}`).join(', ') || 'none' : 'needs viewing key', hidden: true },
  ];
  if (view.spendableCt) {
    const sp = key ? resolveSpendable(view, key) : undefined;
    rows.push({
      label: 'Spendable balance',
      publicValue: redactedCiphertext(view.spendableCt),
      privateValue: key ? (sp?.value !== undefined ? `${formatAmount(sp.value, decimals)} ${symbol}` : 'above recovery bound (holder knows it)') : 'needs viewing key',
      hidden: true,
    });
  }
  if (view.pendingCt) {
    const pe = key ? resolvePending(view, key) : undefined;
    rows.push({
      label: 'Pending balance',
      publicValue: redactedCiphertext(view.pendingCt),
      privateValue: key ? `${formatAmount(pe?.value ?? 0n, decimals)} ${symbol}` : 'needs viewing key',
      hidden: true,
    });
  }
  rows.push({ label: 'Debits (sends, burns)', publicValue: 'visible as transactions from this id; amounts hidden', privateValue: 'known to the holder only', hidden: true });
  return rows;
};

// ── Note model ─────────────────────────────────────────────────────────────

export interface NoteAuditedOutput {
  ownerPk: string;
  value: bigint;
  spent: boolean;
}

/**
 * Note token: the public side has no accounts and no amounts at all, only
 * commitments, nullifiers and ciphertexts. The private side is the auditor's:
 * with the audit key, the newest outputs in the audit trail (this transaction's,
 * if nothing landed after it).
 */
export const observeNoteTransaction = async (
  indexer: string,
  hash: string,
  contractAddress: string,
  decimals: number,
  publicCounts: { commitments: number; nullifiers: number; frozen: number },
  auditorNewest: NoteAuditedOutput[] | undefined,
  nameOfPk: (pk: string) => string,
): Promise<ObservedTx> => {
  const tx = await fetchPublicTx(indexer, hash, contractAddress);
  const ep = tx.entryPoints[0];
  const b32 = tx.transcript ? new Set([...tx.transcript.matchAll(/<\[([0-9a-f]{64})\]: b32>/g)].map((m) => m[1])).size : 0;
  const outputs = ep === 'transfer' || ep === 'burn' ? 2 : ep === 'mint' || ep === 'seize' ? 1 : 0;
  const spends = ep === 'transfer' || ep === 'burn' || ep === 'seize' ? 1 : 0;
  const rows: ObservedRow[] = [
    { label: 'Transaction', publicValue: `${short(tx.hash, 10)} · block ${tx.blockHeight}`, privateValue: 'same', hidden: false },
    { label: 'Contract', publicValue: short(contractAddress, 10), privateValue: 'same', hidden: false },
    { label: 'Circuit called', publicValue: tx.circuit, privateValue: 'same', hidden: false },
    { label: 'Fee', publicValue: tx.feeText, privateValue: 'same', hidden: false },
  ];
  if (outputs || spends) {
    rows.push({
      label: 'Written to the ledger',
      publicValue: `${outputs} commitment(s), ${spends} nullifier(s), ${outputs} encrypted delivery + ${outputs} audit record(s); ${b32} opaque 32-byte hashes in the transcript`,
      privateValue: 'same',
      hidden: false,
    });
    const priv =
      auditorNewest && auditorNewest.length
        ? auditorNewest
            .slice(0, outputs)
            .map((o) => `${nameOfPk(o.ownerPk)} received ${formatAmount(o.value, decimals)}${o.spent ? ' (since spent)' : ''}`)
            .join('; ')
        : 'needs the audit key';
    rows.push({ label: 'Sender', publicValue: 'hidden: the nullifier reveals nothing about who spent', privateValue: spends ? 'the owner of the consumed note (auditor attributes it)' : 'no spend', hidden: spends > 0 });
    rows.push({ label: 'Recipient(s) and amounts', publicValue: 'hidden: no account ids, no amounts', privateValue: priv, hidden: true });
  } else if (ep === 'setFrozen') {
    rows.push({ label: 'Effect', publicValue: 'a nullifier was added to / removed from the frozen set (which note it is stays hidden)', privateValue: 'the auditor knows which note and whose', hidden: true });
  }
  rows.push({
    label: 'Public totals',
    publicValue: `${publicCounts.commitments} commitments, ${publicCounts.nullifiers} nullifiers, ${publicCounts.frozen} frozen; supply encrypted`,
    privateValue: 'same',
    hidden: false,
  });
  return { hash: tx.hash, rows };
};
