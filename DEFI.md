# CFT and note tokens in DeFi: options, abilities, limitations

The account-model token (`cft-demo.compact`) and the note-model token
(`cft-note.compact`) are both **contract-custodied**: a balance or a note is
state inside the token contract, never a ledger-native coin. This document
lays out what that means for DeFi, which routes exist, what each one gains
and gives up, and what is not possible on the stack this project runs on
(Compact 0.31 / ledger 8, the Preview, Preprod and Mainnet line as of
September 2026). Nothing here is implemented; it is the design space.

## The five facts that shape everything

1. **Custody is witness-authenticated.** Every CFT operation identifies the
   caller through witnesses: the account secret, the encryption secret, the
   plaintext of the current balance. The note model needs the spend secret and
   the note contents. A contract has no private state and can never answer a
   witness, so a contract can never own a balance or a note. OpenZeppelin
   states this as "EOA only". A pool, vault or escrow that custodies the asset
   is excluded by the token design, not by this demo.
2. **No cross-contract calls on this stack.** The Compact compiler rejects
   them ("cross-contract calls are not yet supported"), and OpenZeppelin's
   modules reject `ContractAddress` recipients and owners on their safe paths
   for the same reason. A DeFi protocol cannot be a separate contract that
   calls the token. Anything that touches the token must be a circuit **of the
   token contract itself**.
3. **One client builds a transaction.** A circuit call is proven by the person
   whose witnesses it needs. A CFT transfer can only be initiated by the
   holder, so two parties cannot co-sign a single atomic swap of CFT against
   something else. Multi-party settlement needs an intermediate state.
4. **Hidden amounts cannot be computed on.** Balances are exponential ElGamal:
   additive only. A circuit can prove `Dec(ct) == v` for a value someone
   supplies, and can add ciphertexts, but cannot compare, multiply or price
   ciphertexts. Every DeFi formula (constant product, interest, LTV) needs the
   amount in the clear at the point it is used.
5. **Native shielded coins are bearer.** A contract can mint a ledger-native
   shielded token of its own type (`tokenType(domainSep, self)`,
   `mintShieldedToken` / `createZswapOutput`) and can receive and send coins
   (`receiveShielded`, `send`, `mergeCoin`). Once minted, the coin moves by
   Zswap between wallet addresses; the contract has no freeze, seize or view
   over it, and Zswap has no auditor key.

Everything below is a way of living with these five.

## Option A: wrap into a native shielded token

**Mechanics.** Two circuits on the token contract. `wrap(amount)` debits the
caller's CFT spendable balance (the OZ `_burn` path, with the wrapped total
tracked publicly) and mints `amount` of a contract-derived shielded token to a
Zswap address the caller supplies. `unwrap(coin)` receives the coin back and
credits the caller's CFT account through the memo channel like a mint.

**What becomes possible.**

- The asset shows up in 1AM or Lace as a balance, moves wallet to wallet with
  a normal shielded transfer, and can be paid to anyone with a Midnight
  address.
- Any DeFi contract that handles shielded coins can custody it: an AMM pool,
  a lending market, a payment channel. Those contracts never need to know the
  CFT exists.
- Trades between the wrapped token and other coins are private in the Zswap
  sense: amounts and parties hidden on chain.

**What is given up while wrapped.**

- No freeze, no seize, no view. The coin is a bearer instrument. The issuer
  cannot act on it and cannot see who holds it.
- Audit ends at the wrap boundary. The escrowed viewing keys open the
  register, not the coins.

**Where compliance moves.** To the gates, which is the ERC-7540 exit-gating
pattern: `wrap` is refused for frozen accounts and while paused; `unwrap` is
the only way back into the register, so redemption to the real-world asset
(which the issuer settles from the register) requires re-entering a registered,
unfrozen, escrowed account. The issuer can also pause wrapping alone, cap the
wrapped share of supply, or restrict wrapping to accounts it has additionally
approved off chain. The wrapped total is public, so "circulating in the wild"
is a known number.

**Cost.** Two circuits (ten in total, which fits the per-block deploy budget
that rejected twelve). The wrap event itself is public per account: the
explorer sees that account X wrapped, though not how much unless supply math
reveals it.

**Note model.** Identical shape: `wrap` consumes a note and mints a coin,
`unwrap` receives a coin and delivers a new note plus audit record. Wrapping
is the point where the audit trail stops.

## Option B: DeFi inside the token contract

Because there are no cross-contract calls, a product that must keep the asset
in the register has to be built as circuits of the same contract. The
compliance primitives already there are the building blocks, in particular
this observation: **a frozen balance cannot change**, so an amount proven once
at freeze time stays true until the account is unfrozen. That turns freeze,
prove and seize into an escrow primitive that a contract can drive without
holding any viewing key.

### B1. Delivery versus payment (DvP) against a native coin

1. `list(amount, price, payoutAddress)`: the seller proves, with their own
   viewing key, that their spendable balance is at least `amount` (cheap:
   `verifyBalance` in circuit), the contract freezes the seller's account and
   records the listing publicly.
2. `buy(listingId)`: the buyer's transaction pays `price` in a native shielded
   coin into the contract (`receiveShielded`). In the same circuit the contract
   moves `amount` from the frozen seller to the buyer with an internal seize
   variant that takes the recorded amount instead of a viewing-key witness,
   sends the coin to the seller's payout address, unfreezes the seller.
3. `cancel(listingId)`: the seller unfreezes and delists.

This is atomic settlement in one buyer-side transaction, which fact 3 seemed
to forbid: it works because seize is authority-driven, not holder-driven. The
asset never leaves the register, escrowed keys still open every account, and
the issuer's freeze and pause still apply.

**Limits.** The listing amount and price are public. A frozen seller can
neither receive nor spend anything else while listed (the freeze is
all-or-nothing per account; a per-listing partial lock would need a change to
the balance layout). Prices are fixed per listing: this is an order board,
not a pool.

### B2. Lending with the token as collateral

Same pattern. The borrower proves their balance, the contract freezes it and
records the collateral amount, then pays out the loan in a native stablecoin
it holds (`send`). Repayment (`receiveShielded` of principal plus interest)
unfreezes. Default (a public deadline or a posted price crossing a threshold)
lets anyone call `liquidate`, which seizes the recorded amount to the lender
or a liquidation account. Interest and LTV are computed on the recorded
plaintext, which is fine: the borrower disclosed it to the contract when they
proved it.

**Limits.** Collateral amount public; whole-account freeze; pricing needs an
oracle that is also a circuit of this contract (an issuer-posted price is the
realistic version). The lending pool's stablecoin side is a native coin the
contract custodies, which is unproblematic.

### B3. What B cannot do

Swaps against a pool of the token itself. The pool would have to hold CFT
(fact 1), and pricing needs both reserves in the clear (fact 4). Every
"reserve" would be a public number anyway, so there is no confidentiality to
gain by trying.

**Cost and the real constraint.** Each product is two to four circuits on the
same contract. With eight already deployed and a ceiling around ten per
deployment on Preview's block limits, one product fits, two do not. Until
cross-contract calls land, "token plus one DeFi product per deployment" is
the practical shape.

## Option C: change the standard

A CFT revision could add **contract-held accounts** whose balances are public
(a contract cannot keep an encryption secret, so its balance cannot be
confidential) and which are authenticated by the caller's contract address
(`kernel.self()`) instead of witnesses. Combined with cross-contract calls,
that gives ordinary composability: a separate pool contract holds the token,
users call `pool.swap`, the pool calls `token.transferFrom`. OpenZeppelin's
Ownable header describes exactly this migration plan for when
contract-to-contract calls arrive.

**What it would look like.** Confidential between people, transparent at the
pool: every amount that crosses into or out of a contract account is public,
because the contract's balance is. The counterparty graph is already public in
the account model, so the additional leak is amounts at pool boundaries.

**Status.** Not shipped by OpenZeppelin in any version, and it depends on a
compiler feature this stack lacks. Not something this project can add without
forking the standard.

## Option D: the issuer as the venue

The RWA norm today, and what this demo already does: primary issuance and
redemption against fiat or a stablecoin, run by the issuer off chain, with mint
and burn as the on-chain legs. No composability, full control, and the
ERC-7540 request-then-fulfil flow is the natural interface (request
redemption, issuer settles, burns).

## Comparison

| | A: wrap | B: in-contract DvP / lending | C: contract accounts | D: issuer venue |
|---|---|---|---|---|
| Wallet shows the asset | yes (wrapped) | no | no | no |
| Other contracts can custody it | yes (as a coin) | no | yes | no |
| Freeze / seize preserved | at the gates only | yes | yes | yes |
| Escrowed viewing keys still open it | not while wrapped | yes | yes | yes |
| Amounts hidden | in Zswap, yes; unauditable | disclosed to the contract per deal | public at pool boundaries | to the issuer |
| Swaps against a pool | yes, in any coin AMM | no | yes | no |
| Needs cross-contract calls | no | no | yes | no |
| Feasible on Compact 0.31 / ledger 8 | yes | yes | no | yes |
| Circuits added to this contract | 2 | 2 to 4 per product | n/a | 0 |

## What stays out of reach

- **A confidential AMM**, with hidden reserves and hidden trade sizes, is a
  research problem on any chain (it needs MPC, FHE or batch auctions with
  sealed bids). Nothing in Midnight's current primitives provides it.
- **Atomic two-party CFT settlement in one transaction without an
  intermediate state.** Only the holder's client can initiate a CFT transfer,
  so pure peer-to-peer atomic swaps need the listing step of B1.
- **A contract holding the asset while it stays confidential.** Contracts
  cannot keep secrets, so any contract-held balance is public by nature.

## Recommendation

- To show "these tokens can live in a wallet and trade": **Option A**. It is
  two circuits, fits the deploy budget, and makes the compliance trade-off
  visible on one screen: the register on the left with freeze and seize, the
  wrapped coin on the right with neither.
- To show "these tokens can do finance without leaving compliance": **Option
  B1**, delivery versus payment. It reuses freeze, prove and seize as an
  escrow primitive, settles atomically, and keeps the escrowed keys valid
  throughout. It is the less obvious result and the one specific to a
  confidential register.
- Watch for two upstream changes that reopen the design: cross-contract calls
  in Compact, and an OpenZeppelin CFT revision with contract-held accounts.
