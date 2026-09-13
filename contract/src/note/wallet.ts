// Provider-agnostic wallet logic for the note-model token: identities and
// payment addresses, scanning deliveries for our notes, choosing an input
// note, and the auditor's full view of the pool.
import {
  CompactTypeBytes,
  CompactTypeVector,
  degradeToTransient,
  ecMulGenerator,
  persistentHash,
  type JubjubPoint,
} from '@midnight-ntwrk/compact-runtime';
import { pureCircuits, type AuditRecord, type FullDelivery, type Ledger, type Note } from '../managed/cft-note/contract/index.js';
import { fromHex, pointKey, toHex } from '../crypto.js';
import { bigToHex, hexToBig, type NotePrivateState, type NoteRoleSecrets } from './witnesses.js';

const MAX_U128 = (1n << 128n) - 1n;

// ── Identities ─────────────────────────────────────────────────────────────

export const spendPk = (s: NotePrivateState): bigint => pureCircuits.derivePk(fromHex(s.secretKeyHex));
export const encPk = (s: NotePrivateState): JubjubPoint => pureCircuits.encPkOf(hexToBig(s.encSecretHex));

/** What a payer needs to send you a note: spend pk + delivery pk. */
export interface PaymentAddress {
  pk: string;
  encPk: { x: string; y: string };
}

export const paymentAddress = (s: NotePrivateState): PaymentAddress => {
  const e = encPk(s);
  return { pk: bigToHex(spendPk(s)), encPk: { x: bigToHex(e.x), y: bigToHex(e.y) } };
};

export const parsePaymentAddress = (text: string): { pk: bigint; encPk: JubjubPoint } => {
  const p = JSON.parse(text) as Partial<PaymentAddress>;
  if (!p.pk || !p.encPk?.x || !p.encPk?.y) throw new Error('payment address must contain pk and encPk {x, y}');
  return { pk: hexToBig(p.pk), encPk: { x: hexToBig(p.encPk.x), y: hexToBig(p.encPk.y) } };
};

/** Role public values derived from the deployer's secrets (constructor arguments). */
export const roleKeys = (roles: NoteRoleSecrets): { issuerPk: bigint; authorityPk: bigint; auditKey: JubjubPoint; supplyKey: JubjubPoint } => {
  const vec1 = new CompactTypeVector(1, new CompactTypeBytes(32));
  // ElGamal.derivePk: g^degradeToTransient(persistentHash([secret]))
  const supplyScalar = degradeToTransient(persistentHash(vec1, [fromHex(roles.supplySecretHex)]));
  return {
    issuerPk: pureCircuits.derivePk(fromHex(roles.issuerSecretHex)),
    authorityPk: pureCircuits.derivePk(fromHex(roles.authoritySecretHex)),
    auditKey: ecMulGenerator(hexToBig(roles.auditSecretHex)),
    supplyKey: ecMulGenerator(supplyScalar),
  };
};

// ── Ledger readers ─────────────────────────────────────────────────────────

export interface NoteTokenInfo {
  issuerPk: string;
  authorityPk: string;
  auditKey: string;
  commitments: number;
  nullifiers: number;
  deliveries: number;
  frozen: number;
  seizures: number;
}

export const readNoteToken = (ledger: Ledger): NoteTokenInfo => ({
  issuerPk: bigToHex(ledger._issuerPk),
  authorityPk: bigToHex(ledger._authorityPk),
  auditKey: pointKey(ledger._auditKey),
  commitments: Number(ledger._commitments.firstFree()),
  nullifiers: Number(ledger._nullifiers.size()),
  deliveries: Number(ledger._deliveries.length()),
  frozen: Number(ledger._frozen.size()),
  seizures: Number(ledger._seizureCount),
});

export const isNoteIssuer = (ledger: Ledger, s: NotePrivateState): boolean =>
  !!s.roles && pureCircuits.derivePk(fromHex(s.roles.issuerSecretHex)) === ledger._issuerPk;

export const isNoteAuthority = (ledger: Ledger, s: NotePrivateState): boolean =>
  !!s.roles && pureCircuits.derivePk(fromHex(s.roles.authoritySecretHex)) === ledger._authorityPk;

export const isNoteAuditor = (ledger: Ledger, s: NotePrivateState): boolean =>
  !!s.roles && pointKey(ecMulGenerator(hexToBig(s.roles.auditSecretHex))) === pointKey(ledger._auditKey);

// ── Holder view: my notes ──────────────────────────────────────────────────

export interface OwnedNote {
  note: Note;
  commitment: string;
  nullifier: string;
  spent: boolean;
  frozen: boolean;
}

export interface NoteWalletView {
  notes: OwnedNote[];
  /** Sum of unspent, unfrozen notes. */
  spendable: bigint;
  /** Sum of unspent notes that are frozen. */
  frozenValue: bigint;
  largestSpendable: bigint;
}

/**
 * Scan every delivery, open it with our delivery secret, and keep the ones
 * whose commitment (under OUR spend pk) is in the tree: those are our notes.
 * Deliveries to other people decrypt to garbage that commits to nothing.
 */
export const scanNotes = (ledger: Ledger, s: NotePrivateState): NoteWalletView => {
  const pk = spendPk(s);
  const encSk = hexToBig(s.encSecretHex);
  const seen = new Set<string>();
  const notes: OwnedNote[] = [];
  for (const d of ledger._deliveries as Iterable<FullDelivery>) {
    const rec = pureCircuits.recoverNote(d, encSk);
    if (rec.value < 0n || rec.value > MAX_U128) continue;
    const note: Note = { value: rec.value, nonce: rec.nonce };
    const cm = pureCircuits.commitOf(note, pk);
    const cmHex = toHex(cm);
    if (seen.has(cmHex)) continue;
    if (ledger._commitments.findPathForLeaf(cm) === undefined) continue;
    seen.add(cmHex);
    const nf = pureCircuits.nullifierOf(note);
    notes.push({ note, commitment: cmHex, nullifier: toHex(nf), spent: ledger._nullifiers.member(nf), frozen: ledger._frozen.member(nf) });
  }
  const live = notes.filter((n) => !n.spent);
  const spendableNotes = live.filter((n) => !n.frozen);
  return {
    notes,
    spendable: spendableNotes.reduce((a, n) => a + n.note.value, 0n),
    frozenValue: live.filter((n) => n.frozen).reduce((a, n) => a + n.note.value, 0n),
    largestSpendable: spendableNotes.reduce((a, n) => (n.note.value > a ? n.note.value : a), 0n),
  };
};

/**
 * One input note per spend: pick the smallest unspent, unfrozen note that
 * covers `value` (change comes back as a new note). If none does, the holder
 * must first consolidate by paying themselves; explain that.
 */
export const selectInputNote = (view: NoteWalletView, value: bigint, decimals: number): OwnedNote => {
  const candidates = view.notes.filter((n) => !n.spent && !n.frozen && n.note.value >= value).sort((a, b) => (a.note.value < b.note.value ? -1 : 1));
  if (candidates.length === 0) {
    const fmt = (v: bigint) => formatUnits(v, decimals);
    if (view.spendable >= value) {
      throw new Error(
        `no single note covers ${fmt(value)} (largest note is ${fmt(view.largestSpendable)}, total spendable ${fmt(view.spendable)}). ` +
          'A spend consumes one note; send yourself the largest note first to consolidate, then retry.',
      );
    }
    throw new Error(`insufficient spendable balance: ${fmt(view.spendable)} < ${fmt(value)}`);
  }
  return candidates[0];
};

// ── Auditor view: every note in the pool ───────────────────────────────────

export interface AuditedNote {
  index: number;
  ownerPk: string;
  note: Note;
  commitment: string;
  nullifier: string;
  spent: boolean;
  frozen: boolean;
}

/** Open every audit record with the audit secret: the complete transaction graph. */
export const auditView = (ledger: Ledger, auditSecretHex: string): AuditedNote[] => {
  const sk = hexToBig(auditSecretHex);
  const out: AuditedNote[] = [];
  let i = 0;
  for (const r of ledger._auditTrail as Iterable<AuditRecord>) {
    const v = pureCircuits.recoverAuditRecord(r, sk);
    // A wrong audit secret yields random field elements; a real value fits Uint<128>.
    if (v.value < 0n || v.value > MAX_U128) {
      i++;
      continue;
    }
    const note: Note = { value: v.value, nonce: v.nonce };
    const nf = pureCircuits.nullifierOf(note);
    out.push({
      index: i++,
      ownerPk: bigToHex(v.ownerPk),
      note,
      commitment: toHex(pureCircuits.commitOf(note, v.ownerPk)),
      nullifier: toHex(nf),
      spent: ledger._nullifiers.member(nf),
      frozen: ledger._frozen.member(nf),
    });
  }
  return out;
};

// ── Formatting (fixed decimals chosen by the deployment, off-chain) ────────

export const NOTE_DECIMALS = 2;

export const formatUnits = (units: bigint, decimals: number): string => {
  if (decimals === 0) return units.toString();
  const s = units.toString().padStart(decimals + 1, '0');
  const whole = s.slice(0, -decimals);
  const frac = s.slice(-decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
};

export const shortPk = (pkHex: string): string => `${pkHex.slice(0, 8)}…${pkHex.slice(-6)}`;
