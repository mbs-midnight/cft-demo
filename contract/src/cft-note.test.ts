// Local simulation of the note-model token (no network, no proofs).
import { type CircuitContext, createCircuitContext, createConstructorContext, sampleContractAddress } from '@midnight-ntwrk/compact-runtime';
import { describe, expect, it } from 'vitest';
import { Contract, ledger, type Ledger } from './managed/cft-note/contract/index.js';
import { NotePrivateState, noteWitnesses } from './note/witnesses.js';
import {
  auditView,
  encPk,
  isNoteAuditor,
  isNoteAuthority,
  isNoteIssuer,
  parsePaymentAddress,
  paymentAddress,
  readNoteToken,
  roleKeys,
  scanNotes,
  selectInputNote,
  spendPk,
} from './note/wallet.js';
import { fromHex } from './crypto.js';

type Actor = { name: string; state: NotePrivateState };
const actor = (name: string, roles = false): Actor => ({ name, state: NotePrivateState.generate(roles) });

class Sim {
  readonly contract = new Contract<NotePrivateState>(noteWitnesses);
  ctx: CircuitContext<NotePrivateState>;

  constructor(deployer: Actor) {
    const keys = roleKeys(deployer.state.roles!);
    const { currentPrivateState, currentContractState } = this.contract.initialState(
      createConstructorContext(deployer.state, '0'.repeat(64)),
      keys.issuerPk,
      keys.authorityPk,
      keys.auditKey,
      keys.supplyKey,
    );
    this.ctx = createCircuitContext(sampleContractAddress(), '0'.repeat(64), currentContractState, currentPrivateState);
  }

  ledger(): Ledger {
    return ledger(this.ctx.currentQueryContext.state);
  }

  as<R>(who: Actor, fn: (c: CircuitContext<NotePrivateState>) => { context: CircuitContext<NotePrivateState>; result: R }): R {
    const { context, result } = fn({ ...this.ctx, currentPrivateState: who.state });
    this.ctx = context;
    who.state = NotePrivateState.clearInputNote(context.currentPrivateState);
    return result;
  }

  view(who: Actor) {
    return scanNotes(this.ledger(), who.state);
  }

  mint(issuer: Actor, to: Actor, value: bigint) {
    const addr = parsePaymentAddress(JSON.stringify(paymentAddress(to.state)));
    return this.as(issuer, (c) => this.contract.impureCircuits.mint(c, addr.pk, addr.encPk, value));
  }

  transfer(from: Actor, to: Actor, value: bigint) {
    const input = selectInputNote(this.view(from), value, 2);
    from.state = NotePrivateState.withInputNote(from.state, input.note);
    const addr = parsePaymentAddress(JSON.stringify(paymentAddress(to.state)));
    return this.as(from, (c) => this.contract.impureCircuits.transfer(c, addr.pk, addr.encPk, encPk(from.state), value));
  }

  burn(from: Actor, value: bigint) {
    const input = selectInputNote(this.view(from), value, 2);
    from.state = NotePrivateState.withInputNote(from.state, input.note);
    return this.as(from, (c) => this.contract.impureCircuits.burn(c, encPk(from.state), value));
  }

  setFrozen(authority: Actor, nullifierHex: string, frozen: boolean) {
    return this.as(authority, (c) => this.contract.impureCircuits.setFrozen(c, fromHex(nullifierHex), frozen));
  }

  seize(authority: Actor, targetOwnerPk: bigint, target: { value: bigint; nonce: bigint }, recovery: Actor) {
    authority.state = NotePrivateState.withInputNote(authority.state, target);
    const addr = parsePaymentAddress(JSON.stringify(paymentAddress(recovery.state)));
    return this.as(authority, (c) => this.contract.impureCircuits.seize(c, targetOwnerPk, addr.pk, addr.encPk));
  }
}

const setup = () => {
  const deployer = actor('deployer', true);
  const alice = actor('alice');
  const bob = actor('bob');
  const sim = new Sim(deployer);
  return { sim, deployer, alice, bob };
};

describe('note token: lifecycle', () => {
  it('deploys with the four roles bound', () => {
    const { sim, deployer, alice } = setup();
    const l = sim.ledger();
    expect(isNoteIssuer(l, deployer.state)).toBe(true);
    expect(isNoteAuthority(l, deployer.state)).toBe(true);
    expect(isNoteAuditor(l, deployer.state)).toBe(true);
    expect(isNoteIssuer(l, alice.state)).toBe(false);
    expect(readNoteToken(l).commitments).toBe(0);
  });

  it('mint delivers a note only its recipient can find', () => {
    const { sim, deployer, alice, bob } = setup();
    sim.mint(deployer, alice, 100_000n);
    const a = sim.view(alice);
    expect(a.notes).toHaveLength(1);
    expect(a.spendable).toBe(100_000n);
    expect(a.notes[0].spent).toBe(false);
    expect(sim.view(bob).notes).toHaveLength(0);
    expect(readNoteToken(sim.ledger())).toMatchObject({ commitments: 1, deliveries: 1, nullifiers: 0 });
  });

  it('non-issuer cannot mint', () => {
    const { sim, alice, bob } = setup();
    expect(() => sim.mint(alice, bob, 1n)).toThrow(/holds no issuer role/);
  });

  it('transfer spends one note, pays the recipient and returns change', () => {
    const { sim, deployer, alice, bob } = setup();
    sim.mint(deployer, alice, 100_000n);
    sim.transfer(alice, bob, 30_000n);
    const a = sim.view(alice);
    const b = sim.view(bob);
    expect(a.spendable).toBe(70_000n);
    expect(a.notes.filter((n) => n.spent)).toHaveLength(1);
    expect(b.spendable).toBe(30_000n);
    // Public ledger: 3 commitments, 1 nullifier, 3 deliveries; no ids, no amounts.
    expect(readNoteToken(sim.ledger())).toMatchObject({ commitments: 3, nullifiers: 1, deliveries: 3 });
  });

  it('a spent note cannot be spent again', () => {
    const { sim, deployer, alice, bob } = setup();
    sim.mint(deployer, alice, 100n);
    const spent = sim.view(alice).notes[0];
    sim.transfer(alice, bob, 40n);
    alice.state = NotePrivateState.withInputNote(alice.state, spent.note);
    const addr = parsePaymentAddress(JSON.stringify(paymentAddress(bob.state)));
    expect(() => sim.as(alice, (c) => sim.contract.impureCircuits.transfer(c, addr.pk, addr.encPk, encPk(alice.state), 1n))).toThrow(
      /already spent/,
    );
  });

  it('one note per spend: explains when consolidation is needed', () => {
    const { sim, deployer, alice, bob } = setup();
    sim.mint(deployer, alice, 60n);
    sim.mint(deployer, alice, 60n);
    expect(sim.view(alice).spendable).toBe(120n);
    expect(() => sim.transfer(alice, bob, 100n)).toThrow(/no single note covers/);
    // Consolidate by paying self: still one input, so not possible in one step;
    // the realistic path is two payments.
    sim.transfer(alice, bob, 60n);
    sim.transfer(alice, bob, 40n);
    expect(sim.view(bob).spendable).toBe(100n);
    expect(sim.view(alice).spendable).toBe(20n);
  });

  it('burn destroys value and returns change', () => {
    const { sim, deployer, alice } = setup();
    sim.mint(deployer, alice, 1_000n);
    sim.burn(alice, 400n);
    expect(sim.view(alice).spendable).toBe(600n);
  });
});

describe('note token: audit, freeze, seize', () => {
  it('the auditor sees every note with owner, amount and status; nobody else does', () => {
    const { sim, deployer, alice, bob } = setup();
    sim.mint(deployer, alice, 1_000n);
    sim.transfer(alice, bob, 300n);
    const trail = auditView(sim.ledger(), deployer.state.roles!.auditSecretHex);
    // newest first: change(700, alice), out(300, bob), mint(1000, alice)
    expect(trail.map((t) => t.note.value)).toEqual([700n, 300n, 1_000n]);
    const alicePk = '0x' + spendPk(alice.state).toString(16);
    const bobPk = '0x' + spendPk(bob.state).toString(16);
    expect(trail.map((t) => t.ownerPk)).toEqual([alicePk, bobPk, alicePk]);
    expect(trail.map((t) => t.spent)).toEqual([false, false, true]);
    // The wrong audit secret opens nothing: every record decrypts to garbage and is skipped.
    expect(auditView(sim.ledger(), NotePrivateState.generate(true).roles!.auditSecretHex)).toEqual([]);
  });

  it('freeze by nullifier blocks the owner spend; unfreeze restores it', () => {
    const { sim, deployer, alice, bob } = setup();
    sim.mint(deployer, alice, 500n);
    const target = auditView(sim.ledger(), deployer.state.roles!.auditSecretHex)[0];
    sim.setFrozen(deployer, target.nullifier, true);
    expect(sim.view(alice).frozenValue).toBe(500n);
    expect(sim.view(alice).spendable).toBe(0n);
    // Force the frozen note as input to hit the circuit's own check.
    alice.state = NotePrivateState.withInputNote(alice.state, target.note);
    const addr = parsePaymentAddress(JSON.stringify(paymentAddress(bob.state)));
    expect(() => sim.as(alice, (c) => sim.contract.impureCircuits.transfer(c, addr.pk, addr.encPk, encPk(alice.state), 1n))).toThrow(
      /note is frozen/,
    );
    expect(() => sim.setFrozen(alice, target.nullifier, false)).toThrow(/holds no authority role/);
    sim.setFrozen(deployer, target.nullifier, false);
    sim.transfer(alice, bob, 100n);
    expect(sim.view(bob).spendable).toBe(100n);
  });

  it('seize consumes the target note without the owner and re-mints it to recovery', () => {
    const { sim, deployer, alice, bob } = setup();
    sim.mint(deployer, alice, 800n);
    sim.transfer(alice, bob, 250n);
    const bobNote = auditView(sim.ledger(), deployer.state.roles!.auditSecretHex).find((t) => t.note.value === 250n)!;
    sim.setFrozen(deployer, bobNote.nullifier, true);
    expect(() => sim.seize(alice, spendPk(bob.state), bobNote.note, deployer)).toThrow(/holds no authority role/);

    sim.seize(deployer, spendPk(bob.state), bobNote.note, deployer);
    expect(sim.view(bob).spendable).toBe(0n);
    expect(sim.view(bob).notes[0].spent).toBe(true);
    expect(sim.view(deployer).spendable).toBe(250n);
    expect(readNoteToken(sim.ledger()).seizures).toBe(1);
    // Alice's change is untouched.
    expect(sim.view(alice).spendable).toBe(550n);
  });
});
