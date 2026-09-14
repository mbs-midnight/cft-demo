// Local simulation of the CFT demo contract (no network, no proofs): runs the
// circuits against an in-memory ledger with real witnesses, exactly the way
// midnight-js does before proving. Covers the full compliance flow.
import {
  type CircuitContext,
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import { describe, expect, it } from 'vitest';
import { Contract, ledger, type Ledger, type Witnesses } from './managed/cft-demo/contract/index.js';
import { CftPrivateState, witnesses } from './witnesses.js';
import { accountIdFromSecretKey, addCiphertexts, derivePk, fromHex, hexToScalar, pointKey, randomEscrowScalar, toHex, verifyBalance } from './crypto.js';
import {
  formatAmount,
  holdsComplianceKey,
  memoHistory,
  openEscrowedKey,
  parseAmount,
  readAccount,
  readToken,
  resolveBalance,
  resolvePending,
  resolveSpendable,
} from './wallet.js';

type Actor = { name: string; state: CftPrivateState; id: string };

const actor = (name: string): Actor => {
  const state = CftPrivateState.generate();
  return { name, state, id: toHex(accountIdFromSecretKey(fromHex(state.secretKeyHex))) };
};
/** The actor's viewing key (scalar hex), as its wallet would export it. */
const vk = (a: Actor) => CftPrivateState.viewingKeyHex(a.state);

class Sim {
  readonly contract: Contract<CftPrivateState>;
  ctx: CircuitContext<CftPrivateState>;

  /** The deployer's EK doubles as the compliance key, as the demo does. */
  constructor(issuer: Actor, wit: Witnesses<CftPrivateState> = witnesses, name = 'Confidential Dollar', symbol = 'cUSD', decimals = 2n) {
    this.contract = new Contract<CftPrivateState>(wit);
    const { currentPrivateState, currentContractState } = this.contract.initialState(
      createConstructorContext(issuer.state, '0'.repeat(64)),
      name,
      symbol,
      decimals,
      fromHex(issuer.id),
      derivePk(fromHex(issuer.state.encryptionKeyHex)),
    );
    this.ctx = createCircuitContext(sampleContractAddress(), '0'.repeat(64), currentContractState, currentPrivateState);
  }

  ledger(): Ledger {
    return ledger(this.ctx.currentQueryContext.state);
  }

  /** Run `fn` as `who`: swaps in their private state, persists it back. */
  as<R>(who: Actor, fn: (ctx: CircuitContext<CftPrivateState>) => { context: CircuitContext<CftPrivateState>; result: R }): R {
    const before = { ...this.ctx, currentPrivateState: CftPrivateState.withFreshSeed(who.state) };
    const { context, result } = fn(before);
    this.ctx = context;
    who.state = { ...context.currentPrivateState, randomnessSeedHex: undefined };
    return result;
  }

  /** Make sure the actor's cache knows its current spendable balance (as the app does before a debit). */
  syncSpendable(who: Actor): bigint {
    const view = readAccount(this.ledger(), who.id);
    const r = resolveSpendable(view, vk(who), who.state);
    if (r.value === undefined || !view.spendableCt) throw new Error('balance unknown');
    who.state = CftPrivateState.cachePlaintext(who.state, view.spendableCt, r.value);
    return r.value;
  }

  balances(who: Actor): { spendable: bigint; pending: bigint } {
    const view = readAccount(this.ledger(), who.id);
    const spendable = resolveSpendable(view, vk(who), who.state).value;
    const pending = resolvePending(view, vk(who)).value;
    if (spendable === undefined || pending === undefined) throw new Error('balance unknown');
    return { spendable, pending };
  }

  register(who: Actor) {
    return this.as(who, (c) => this.contract.impureCircuits.register(c));
  }
  sweep(who: Actor) {
    return this.as(who, (c) => this.contract.impureCircuits.sweep(c));
  }
  transfer(who: Actor, to: Actor, value: bigint) {
    this.syncSpendable(who);
    return this.as(who, (c) => this.contract.impureCircuits.transfer(c, fromHex(to.id), value));
  }
  burn(who: Actor, value: bigint) {
    this.syncSpendable(who);
    return this.as(who, (c) => this.contract.impureCircuits.burn(c, value));
  }
  mint(issuer: Actor, to: Actor, value: bigint) {
    return this.as(issuer, (c) => this.contract.impureCircuits.mint(c, fromHex(to.id), value));
  }
  freeze(issuer: Actor, who: Actor) {
    return this.as(issuer, (c) => this.contract.impureCircuits.setFrozen(c, fromHex(who.id), true));
  }
  unfreeze(issuer: Actor, who: Actor) {
    return this.as(issuer, (c) => this.contract.impureCircuits.setFrozen(c, fromHex(who.id), false));
  }
  pause(issuer: Actor) {
    return this.as(issuer, (c) => this.contract.impureCircuits.setPaused(c, true));
  }
  unpause(issuer: Actor) {
    return this.as(issuer, (c) => this.contract.impureCircuits.setPaused(c, false));
  }
  seize(issuer: Actor, target: Actor, to: Actor) {
    return this.as(issuer, (c) => this.contract.impureCircuits.seize(c, fromHex(target.id), fromHex(to.id)));
  }
}

const setup = () => {
  const issuer = actor('issuer');
  const alice = actor('alice');
  const bob = actor('bob');
  const sim = new Sim(issuer);
  // Permissionless: nobody asks the issuer before registering.
  sim.register(issuer);
  sim.register(alice);
  sim.register(bob);
  return { sim, issuer, alice, bob };
};

describe('CFT demo: lifecycle', () => {
  it('deploys with metadata, issuer and compliance key', () => {
    const { sim, issuer } = setup();
    const info = readToken(sim.ledger());
    expect(info.name).toBe('Confidential Dollar');
    expect(info.symbol).toBe('cUSD');
    expect(info.decimals).toBe(2);
    expect(info.totalSupply).toBe(0n);
    expect(info.issuerAccountId).toBe(issuer.id);
    expect(info.registered).toBe(3);
    expect(info.escrowed).toBe(3);
    expect(info.paused).toBe(false);
    expect(info.complianceKey).toBe(pointKey(derivePk(fromHex(issuer.state.encryptionKeyHex))));
    expect(holdsComplianceKey(sim.ledger(), issuer.state.encryptionKeyHex)).toBe(true);
    expect(holdsComplianceKey(sim.ledger(), CftPrivateState.generate().encryptionKeyHex)).toBe(false);
  });

  it('mint lands in pending, sweep makes it spendable, totalSupply is public', () => {
    const { sim, issuer, alice } = setup();
    sim.mint(issuer, alice, parseAmount('1000.00', 2));
    expect(readToken(sim.ledger()).totalSupply).toBe(100_000n);
    expect(sim.balances(alice)).toEqual({ spendable: 0n, pending: 100_000n });

    // The memo delivers the exact amount to the recipient's viewing key.
    expect(memoHistory(readAccount(sim.ledger(), alice.id), vk(alice))).toEqual([100_000n]);

    sim.sweep(alice);
    expect(sim.balances(alice)).toEqual({ spendable: 100_000n, pending: 0n });
  });

  it('register is permissionless and escrows the viewing key to the compliance key', () => {
    const { sim, issuer } = setup();
    const carol = actor('carol'); // a wallet in the wild: never talked to the issuer
    sim.register(carol);
    const l = sim.ledger();
    expect(readAccount(l, carol.id)).toMatchObject({ registered: true, escrowed: true });
    expect(readToken(l).escrowed).toBe(4);
    // The compliance secret opens the escrow to exactly Carol's viewing key...
    expect(openEscrowedKey(l, carol.id, issuer.state.encryptionKeyHex)).toBe(vk(carol));
    // ...and a wrong secret opens it to garbage, which the pk check rejects.
    expect(openEscrowedKey(l, carol.id, CftPrivateState.generate().encryptionKeyHex)).toBeUndefined();
    expect(() => sim.register(carol)).toThrow(/already registered/);
  });

  it('the escrow is bound to the registered key: escrowing a different scalar fails the proof', () => {
    const issuer = actor('issuer');
    const cheating: Witnesses<CftPrivateState> = {
      ...witnesses,
      wit_ViewingScalar: ({ privateState }) => [privateState, randomEscrowScalar()],
    };
    const sim = new Sim(issuer, cheating);
    expect(() => sim.register(issuer)).toThrow(/viewing key does not match the account/);
    expect(readToken(sim.ledger()).escrowed).toBe(0);
  });

  it('non-issuer cannot mint', () => {
    const { sim, alice, bob } = setup();
    expect(() => sim.mint(alice, bob, 1n)).toThrow(/Ownable: caller is not the owner/);
  });

  it('confidential transfer moves value; memo tells the recipient the amount', () => {
    const { sim, issuer, alice, bob } = setup();
    sim.mint(issuer, alice, 100_000n);
    sim.sweep(alice);
    const sender = sim.transfer(alice, bob, 30_000n);
    expect(toHex(sender)).toBe(alice.id);

    expect(sim.balances(alice)).toEqual({ spendable: 70_000n, pending: 0n });
    expect(sim.balances(bob)).toEqual({ spendable: 0n, pending: 30_000n });
    expect(memoHistory(readAccount(sim.ledger(), bob.id), vk(bob))).toEqual([30_000n]);

    // Bob's viewing key does not open Alice's balance.
    const aliceView = readAccount(sim.ledger(), alice.id);
    expect(verifyBalance(aliceView.spendableCt!, hexToScalar(vk(bob)), 70_000n)).toBe(false);
    expect(verifyBalance(aliceView.spendableCt!, hexToScalar(vk(alice)), 70_000n)).toBe(true);
  });

  it('a wrong viewing key opens nothing and never throws', () => {
    const { sim, issuer, alice } = setup();
    sim.mint(issuer, alice, 1_000n);
    sim.sweep(alice);
    sim.mint(issuer, alice, 5n);
    const view = readAccount(sim.ledger(), alice.id);
    const wrong = CftPrivateState.viewingKeyHex(CftPrivateState.generate());
    expect(resolvePending(view, wrong)).toEqual({ value: undefined, source: 'unknown' });
    expect(resolveSpendable(view, wrong)).toEqual({ value: undefined, source: 'unknown' });
    expect(resolvePending(view, vk(alice))).toEqual({ value: 5n, source: 'memos' });
  });

  it('rejects overspend and self-transfer', () => {
    const { sim, issuer, alice, bob } = setup();
    sim.mint(issuer, alice, 100n);
    sim.sweep(alice);
    expect(() => sim.transfer(alice, bob, 101n)).toThrow(/insufficient balance/);
    expect(() => sim.transfer(alice, alice, 1n)).toThrow(/self-transfer/);
  });

  it('burn reduces the balance and totalSupply', () => {
    const { sim, issuer, alice } = setup();
    sim.mint(issuer, alice, 1_000n);
    sim.sweep(alice);
    sim.burn(alice, 400n);
    expect(sim.balances(alice).spendable).toBe(600n);
    expect(readToken(sim.ledger()).totalSupply).toBe(600n);
  });

  it('pending is resolved exactly from memos, far above the recovery bound', () => {
    const { sim, issuer, alice } = setup();
    const big = 10n ** 15n; // 1e15 units, way past 2^32
    sim.mint(issuer, alice, big);
    sim.mint(issuer, alice, 7n);
    const view = readAccount(sim.ledger(), alice.id);
    expect(resolvePending(view, vk(alice))).toEqual({ value: big + 7n, source: 'memos' });
    // Spendable is still zero (nothing swept) and is recognised as such.
    expect(resolveSpendable(view, vk(alice), alice.state)).toEqual({ value: 0n, source: 'zero' });
  });

  it('spendable follows the wallet arithmetic via candidates, with no cache and no recovery', () => {
    const { sim, issuer, alice, bob } = setup();
    const big = 10n ** 15n;
    sim.mint(issuer, alice, big);
    // The wallet knows spendable(0) + pending(big) is what sweep produces.
    alice.state = CftPrivateState.withSpendableCandidate(alice.state, big);
    sim.sweep(alice);
    alice.state = { ...alice.state, plaintextCache: {} };
    let view = readAccount(sim.ledger(), alice.id);
    expect(resolveSpendable(view, vk(alice), alice.state)).toEqual({ value: big, source: 'candidate' });

    // Transfer: the candidate is old - value, and the spend needs the cache primed (syncSpendable does that).
    alice.state = CftPrivateState.withSpendableCandidate(alice.state, big - 5n);
    sim.transfer(alice, bob, 5n);
    alice.state = { ...alice.state, plaintextCache: {} };
    view = readAccount(sim.ledger(), alice.id);
    expect(resolveSpendable(view, vk(alice), alice.state)).toEqual({ value: big - 5n, source: 'candidate' });
    // A stranger with the viewing key but no bookkeeping cannot open it (bound), a holder claim verifies.
    expect(resolveSpendable(view, vk(alice))).toEqual({ value: undefined, source: 'unknown' });
    expect(verifyBalance(view.spendableCt!, hexToScalar(vk(alice)), big - 5n)).toBe(true);
  });

  it('a never-spent account recovers its spendable from memos alone, above the recovery bound', () => {
    const { sim, issuer, alice } = setup();
    const big = 10n ** 13n; // 10,000,000.0000 at 4 decimals: far above 2^32 units
    sim.mint(issuer, alice, big);
    sim.sweep(alice);
    alice.state = { ...alice.state, plaintextCache: {}, spendableCandidates: [] };
    const view = readAccount(sim.ledger(), alice.id);
    expect(resolveSpendable(view, vk(alice), alice.state)).toEqual({ value: big, source: 'memos' });
  });

  it('recovers a balance from the ciphertext alone when the cache is lost', () => {
    const { sim, issuer, alice } = setup();
    sim.mint(issuer, alice, 123_456_789n); // > 2^16, exercises giant steps
    sim.sweep(alice);
    alice.state = { ...alice.state, plaintextCache: {} };
    const r = resolveBalance(readAccount(sim.ledger(), alice.id).spendableCt, vk(alice), alice.state);
    expect(r).toEqual({ value: 123_456_789n, source: 'recovered' });
  });
});

describe('CFT demo: compliance', () => {
  it('freeze blocks sending, receiving, burning and minting; unfreeze restores', () => {
    const { sim, issuer, alice, bob } = setup();
    sim.mint(issuer, alice, 1_000n);
    sim.mint(issuer, bob, 1_000n);
    sim.sweep(alice);
    sim.sweep(bob);

    sim.freeze(issuer, bob);
    expect(readAccount(sim.ledger(), bob.id).frozen).toBe(true);
    expect(() => sim.transfer(bob, alice, 1n)).toThrow(/account frozen/);
    expect(() => sim.transfer(alice, bob, 1n)).toThrow(/account frozen/);
    expect(() => sim.burn(bob, 1n)).toThrow(/account frozen/);
    expect(() => sim.mint(issuer, bob, 1n)).toThrow(/account frozen/);
    expect(() => sim.freeze(alice, bob)).toThrow(/caller is not the owner/);

    sim.unfreeze(issuer, bob);
    sim.transfer(bob, alice, 1n);
    expect(sim.balances(alice).pending).toBe(1n);
  });

  it('pause halts value movement', () => {
    const { sim, issuer, alice, bob } = setup();
    sim.mint(issuer, alice, 100n);
    sim.sweep(alice);
    sim.pause(issuer);
    expect(readToken(sim.ledger()).paused).toBe(true);
    expect(() => sim.transfer(alice, bob, 1n)).toThrow(/paused/);
    expect(() => sim.mint(issuer, alice, 1n)).toThrow(/paused/);
    sim.unpause(issuer);
    sim.transfer(alice, bob, 1n);
  });

  it('seizes a wallet in the wild from its escrow alone, conserving supply', () => {
    const { sim, issuer, alice } = setup();
    // Carol never contacted the issuer; she received tokens from Alice.
    const carol = actor('carol');
    sim.register(carol);
    sim.mint(issuer, alice, 10_000n);
    sim.sweep(alice);
    sim.transfer(alice, carol, 5_000n);
    sim.sweep(carol);
    sim.transfer(alice, carol, 250n); // leave something pending too
    const supplyBefore = readToken(sim.ledger()).totalSupply;

    // Not frozen yet.
    expect(() => sim.seize(issuer, carol, issuer)).toThrow(/requires a frozen account/);
    sim.freeze(issuer, carol);

    // Issuer wallet has not opened the escrow yet: the witness cannot answer.
    expect(() => sim.seize(issuer, carol, issuer)).toThrow(/no viewing key/);

    // A wrong scalar fails the in-circuit key check.
    const carolView = readAccount(sim.ledger(), carol.id);
    const totalCt = addCiphertexts(carolView.spendableCt!, carolView.pendingCt!);
    issuer.state = CftPrivateState.withViewingKey(issuer.state, carol.id, CftPrivateState.viewingKeyHex(CftPrivateState.generate()));
    issuer.state = CftPrivateState.withViewedBalance(issuer.state, totalCt, 5_250n);
    expect(() => sim.seize(issuer, carol, issuer)).toThrow(/viewing key does not match the account/);

    // The real path: open Carol's escrow with the compliance secret, recover
    // the exact total from the chain, then the seizure proves it.
    const opened = openEscrowedKey(sim.ledger(), carol.id, issuer.state.encryptionKeyHex)!;
    expect(opened).toBe(vk(carol));
    issuer.state = CftPrivateState.withViewingKey(issuer.state, carol.id, opened);
    const recovered = resolveBalance(totalCt, opened).value;
    expect(recovered).toBe(5_250n);
    // A wrong amount fails the opening check.
    issuer.state = CftPrivateState.withViewedBalance(issuer.state, totalCt, 5_251n);
    expect(() => sim.seize(issuer, carol, issuer)).toThrow(/does not open the balance to this amount/);
    issuer.state = CftPrivateState.withViewedBalance(issuer.state, totalCt, recovered!);
    sim.seize(issuer, carol, issuer);

    expect(sim.balances(carol)).toEqual({ spendable: 0n, pending: 0n });
    expect(sim.balances(issuer)).toEqual({ spendable: 0n, pending: 5_250n });
    expect(readToken(sim.ledger()).totalSupply).toBe(supplyBefore);
    // The treasury learns the seized amount privately from its memo.
    expect(memoHistory(readAccount(sim.ledger(), issuer.id), vk(issuer))[0]).toBe(5_250n);
    // Alice is unaffected.
    expect(sim.balances(alice)).toEqual({ spendable: 4_750n, pending: 0n });
  });

  it('formats and parses amounts', () => {
    expect(formatAmount(100_000n, 2)).toBe('1000');
    expect(formatAmount(123_456n, 2)).toBe('1234.56');
    expect(parseAmount('1234.5', 2)).toBe(123_450n);
    expect(() => parseAmount('1.234', 2)).toThrow();
  });
});
