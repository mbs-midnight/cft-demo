# CFT and note tokens in DeFi: options, abilities, limitations

The account-model token (`cft-demo.compact`) and the note-model token
(`cft-note.compact`) are **contract-custodied**: a balance or a note is state
inside the token contract, never a ledger-native coin. This document lays out
what that means for DeFi on the two stacks that matter right now:

| | Today: ledger 8 | Next: ledger 9 |
|---|---|---|
| Networks | Preview, Preprod, Mainnet | Stagenet |
| Compact toolchain | 0.31.1 (language 0.23) | 0.34.0 (language 0.26, release notes dated 2026-08-18) |
| Client SDK | midnight-js 4.1.1, wallet-sdk 1.x / facade 3.0 | midnight-js 5.0.0-beta, wallet-sdk 2.0.0-beta |
| Cross-contract calls | compiler rejects them | supported (since toolchain 0.33; callees may move shielded coins since 0.34) |
| Consumer wallets | 1AM, Lace | none yet (1AM and Lace do not offer Stagenet; Gero added the network, connector status unknown) |
| This project | everything here runs and is tested | contracts compile; headless CLI runs are possible with the Stagenet SDK line; the browser demo cannot connect |

Nothing below is implemented in this repository. It is the design space, with
each option marked by what it needs. Ledger 9 is treated as real: it is
deployed on Stagenet and its cross-contract calls are documented in the Compact
reference, so designs that rely on it are "buildable and testable headlessly
today, demonstrable in a wallet later", not speculation.

## The constraints, and which of them a stack change lifts

**Permanent (cryptographic or by construction; no stack lifts them):**

1. **A contract cannot custody a confidential balance or a note.** Every CFT
   operation authenticates the caller through witnesses: the account secret,
   the encryption secret, the plaintext of the current balance. The note model
   needs the spend secret and the note contents. A contract has no private
   state and can never answer a witness. OpenZeppelin's current `main` says it
   plainly in the module header of
   [`contracts/src/token/ConfidentialFungibleToken.compact`, lines 200-209](https://github.com/OpenZeppelin/compact-contracts/blob/main/contracts/src/token/ConfidentialFungibleToken.compact#L200-L209)
   (commit `b871037`, 2026-09-02): "A contract has no private state, so it
   cannot custody such a key; it could be blindly credited (the homomorphic
   add needs no key) but could never spend, decrypt its balance, or scan
   memos. This is a cryptographic limitation, NOT a missing interface." So a
   pool, vault or escrow that holds the asset **as a contract** is out on every
   stack. The same header names the two doors that remain, and both amount
   to a person or a committee holding keys for the protocol: today, "a
   protocol that needs to 'hold' these tokens uses an EOA-custodied account it
   controls (supported today via `approve` / `transferFrom`), not the contract
   itself"; later, "if a contract key-custody scheme ever lands alongside c2c
   (e.g. a designated operator, threshold/MPC decryption, or a viewing-key
   arrangement), a contract obtains a `Bytes<32>` accountId via that scheme
   and the value logic is unchanged". Option B below is the on-chain version
   of that idea with the issuer's authority as the operator; an operator- or
   MPC-custodied account is the off-chain version.
2. **Hidden amounts cannot be computed on.** Balances are exponential ElGamal,
   additive only. A circuit can prove `Dec(ct) == v` for a `v` someone
   supplies and can add ciphertexts; it cannot compare, multiply or price
   them. Every DeFi formula needs the amount in the clear where it is used.
3. **Native shielded coins are bearer.** A contract can mint a ledger-native
   shielded token of its own type and can hold, receive and send coins. Once
   minted, a coin moves by Zswap between addresses; the contract has no
   freeze, seize or view over it, and Zswap has no auditor key.
4. **One client proves a transaction.** A circuit, and on ledger 9 the whole
   cross-contract call graph beneath it, is proven by the person whose
   witnesses it uses. Another party's witnesses are never available, so two
   parties cannot co-sign one atomic swap of their respective confidential
   balances.

**Stack-dependent (ledger 9 changes them):**

5. **No cross-contract calls** on ledger 8: the compiler rejects them
   ("cross-contract calls are not yet supported") and OpenZeppelin's modules
   refuse `ContractAddress` owners and recipients for that reason. On ledger 9
   a contract declares the interface of another as a `contract` type,
   receives a reference to it (as an argument or from its ledger) and calls
   its circuits; the calls are part of the same transaction and succeed or
   fail together. The rule that shapes everything: **a callee circuit must
   not use witnesses**, directly or indirectly. Its only access to private
   data is its arguments. Callees may perform shielded coin operations (own
   public key, create Zswap input and output), so they can hold and move
   native coins. The current implementation also allows one implementation
   per contract type per DApp (the caller's artifacts must ship the callee's
   compiled JavaScript alongside) and forbids cycles in the call graph.
6. **Deploy budget.** A deploy is one transaction, and the node caps any
   single transaction well below a full block. See "The deploy budget,
   measured" below for the rule and the numbers; the short version is that
   ten circuits of this contract's shape are proven to deploy, eleven fit by
   the measured model but are untested, and twelve were refused, not the
   eighteen that dividing the block's write limit by a verifier key
   suggests. Ledger 9 has its own cost model (Stagenet's differs from the
   genesis defaults); assume a similar ceiling until measured. Cross-contract
   calls relieve it by letting a product live in its own contract, and
   maintenance updates relieve it by letting a contract grow after deploy.

Constraint 5 has a consequence worth stating on its own. Every
**value-bearing** circuit of the CFT and of the note token uses witnesses
(register, transfer, sweep, burn, mint, seize, approve, transferFrom), so
**no circuit that moves value can be a callee**, on ledger 9 or later. No pool
will ever call `token.transfer`. Read-only circuits are different:
OpenZeppelin's `main` exports witness-free `balanceOf`, `pendingOf`,
`allowance` and `isRegistered`, and the `allowance` docstring calls its result
"safe to prove (e.g. through a contract-to-contract call)". A contract can
therefore read a ciphertext or a registration flag from the token; it cannot
make the token do anything. (This demo's wrapper exports no read circuits
because the UI reads the ledger directly; it could add them.) The token can,
however, be a **caller**: its circuits already run inside the holder's proof
with the holder's witnesses, and from there they may call witness-free
circuits on other contracts. Composability on Midnight therefore points the
opposite way from Ethereum: the confidential token orchestrates, and DeFi
contracts are witness-free coin vaults with rules.

## The deploy budget, measured

The rule is the node's, not the ledger's. Midnight's node computes a
transaction's cost in five dimensions (read time, compute time, block usage,
bytes written, bytes churned), normalizes each against the ledger's
`block_limits`, takes the **largest** as the transaction's fullness, and maps
that to a Substrate extrinsic weight as fullness times the block's maximum
weight, plus a fixed transaction-size weight (default 1% of a block; the
chain storage that could override it is unset on both Preview and the
standalone stack). Substrate's `CheckWeight` then applies the runtime's
`BlockWeights`, read from both nodes: the normal-dispatch class may fill 75%
of the block in total, but a **single extrinsic may not exceed
`maxExtrinsic` = 64.99%** of the block (the standard `with_sensible_defaults`
layout, which reserves an average `on_initialize` allowance out of the 75%).
Accrued block weight is not the issue: on both networks an empty block carries
1.09% mandatory weight (three inherent extrinsics) and 0% normal weight. A
transaction over `maxExtrinsic` is refused at submission with the standard
Substrate text "Transaction would exhaust the block limits" (RPC error 1010),
which is what this project hit on 2026-09-11 with a twelve-circuit deploy.
The wallet's own fee check had passed, because the wallet normalizes against
the whole block, not the single-extrinsic cap.

For a deploy the binding dimension is bytes written. Measured with ledger-v8's
own `Transaction.cost` against Preview's live parameters (the standalone
stack's are identical):

| Deploy | bytes written | of the 50,000 write limit | extrinsic weight (fullness + 1%) | vs `maxExtrinsic` 64.99% |
|---|---|---|---|---|
| this contract, 8 circuits, as finalized on chain | 22,534 | 45.1% | 46.1% | fits (deployed) |
| the earlier 10-circuit version, as finalized | 27,076 | 54.2% | 55.2% | fits (deployed 2026-09-11) |
| synthetic 11 circuits of this shape | about 30,900 | about 62% | about 63% | fits by the model, untested |
| synthetic 12 circuits | 33,496 | 67.0% | 68.0% | over: refused live 2026-09-11 |
| synthetic 14 circuits | 38,929 | 77.9% | 78.9% | over |
| synthetic 18 circuits | 49,605 | 99.2% | 100.2% | over |

The synthetic rows clone this contract's verifier keys under new entry-point
names with distinct bytes; identical bytes are undercounted because the
ledger's storage is content-addressed. Each additional distinct circuit of
this shape adds about 2.6 to 2.7 KB written, or about 5 points of fullness;
the eleven-circuit row is interpolated from the measured neighbors. The other
four dimensions stay under 3% for a deploy of any size tried. So: ten
circuits proven, eleven modeled to fit with about two points to spare, twelve
refused.

Two qualifications. Verifier-key size barely depends on `k` for the circuits
here (2,119 to 2,311 bytes across `k` 10 to 16), so "count the circuits" is a
fair proxy for circuits shaped like these eight; OpenZeppelin reports that its
SHA-256-heavy full surface did not fit on the same stack, and this project has
not measured what those circuits write. And the ceiling applies per deploy
**transaction**, not per contract: ledger-8 maintenance updates can insert
new verifier keys under new entry points (`VerifierKeyInsert`), so a contract
can, as OpenZeppelin's header says, "start with a lean surface and add
operations by upgrade". What a maintenance update cannot do is change the
ledger layout, so any field a later circuit will need must be declared at
deploy.

## Option A: wrap into a native shielded token

**Mechanics.** Two circuits on the token contract. `wrap(amount)` debits the
caller's spendable balance (the OZ burn path, with the wrapped total tracked
publicly) and mints `amount` of a contract-derived shielded token to a Zswap
address the caller supplies. `unwrap(coin)` receives the coin back and
credits the caller's account through the memo channel like a mint.

**What becomes possible.** The asset shows up in a wallet, moves wallet to
wallet as a shielded transfer, and can be custodied by any contract that
handles shielded coins: an AMM pool, a lending market, a payment channel.
Trades against other coins are private in the Zswap sense.

**What is given up while wrapped.** Freeze, seize and view. The coin is a
bearer instrument; the escrowed viewing keys open the register, not the coins.

**Where compliance moves.** To the gates, the ERC-7540 exit-gating pattern:
`wrap` refused for frozen accounts and while paused; `unwrap` the only way
back, so redemption to the real-world asset (settled from the register)
requires re-entering a registered, unfrozen, escrowed account. The issuer can
pause wrapping alone or cap the wrapped share of supply.

**A leak to decide about.** If the contract tracks the wrapped total in a
public ledger field, every `wrap` and `unwrap` amount is revealed by the
delta, exactly as mint and burn amounts leak through `totalSupply` today
(OpenZeppelin's header makes the same warning about public-supply layers).
The alternatives are to not track it on chain (the issuer can still audit
wraps per account through the escrowed keys) or to accept the leak as the
price of a public "circulating in the wild" figure.

**On ledger 8:** buildable now. Two more circuits makes ten, which the
measurements above put at about 55% of the node's weight ceiling, the same
as the ten-circuit version that deployed on 2026-09-11. `k` affects
prover-key size and proving time; for the deploy it matters only through the
verifier key, which is near-constant for circuits shaped like these. **On ledger 9:**
identical, and the wrapped coin is what plugs the asset into whatever
cross-contract DeFi appears there, since coins need no witnesses to be held.

**Note model:** the same shape; wrapping is where the audit trail stops.

## Option B: keep the asset in the register, build the finance around it

The compliance primitives already in the wrapper are the building blocks. The
key observation: **a frozen balance cannot change**, so an amount proven once
at freeze time stays true until the account is unfrozen. That turns freeze,
prove and seize into an escrow primitive that a contract can drive without
any viewing key: the holder proves their own balance (cheap, exact), the
contract freezes and records the amount, and a later seize of that recorded
amount needs no witness from anyone.

### B1. Delivery versus payment against a native coin

1. `list(amount, price, payoutAddress)`: the seller proves, with their own
   key, that their spendable balance covers `amount`; the contract freezes the
   seller and records the listing.
2. `buy(listingId)`: the buyer pays `price` in a native shielded coin; in the
   same circuit the contract moves `amount` from the frozen seller to the
   buyer (an internal seize that takes the recorded amount instead of a
   viewing-key witness), pays the seller, unfreezes the seller.
3. `cancel(listingId)`: seller unfreezes and delists.

Atomic settlement in one buyer-side transaction, despite constraint 4: seize
is authority-driven, not holder-driven. The asset never leaves the register,
escrowed keys still open every account, freeze and pause still apply.

Limits: the listing amount and price are public; the seller's whole account
is frozen while listed (a partial lock needs a change to the balance layout);
fixed price per listing, an order board rather than a pool.

**The wallet-side requirement that comes with any authority-driven debit.**
OpenZeppelin's header is explicit that memos record credits only and that
"the wallet's running plaintext cache, not memo replay, is the authoritative
balance". A settlement, a liquidation or today's `seize` is a debit the
holder's wallet did not make. If the wallet keeps a stale plaintext, its next
`wit_PlaintextBalance` is wrong, `ElGamal_assertDecryptsTo` fails inside the
proof, and the account is unusable until the wallet recovers the true value.
Two mitigations, both needed: the contract should record the debited amount
publicly (the listing already does) so a wallet can compute `old - amount` as
a candidate, and wallets must treat a changed spendable ciphertext as a cache
miss rather than a cache hit. This project's wallet layer keys its cache by
ciphertext, so a foreign debit misses and falls through to candidates, memo
sums, bounded recovery and finally a holder-typed value; today's full `seize`
writes the fixed `Enc(0)`, which it recognises as zero. A wallet built on
OpenZeppelin's test witness alone has none of that. This is an integration
requirement for 1AM and Lace, not a footnote, and it is the first thing a
custodian's engineer will ask about.

**Freeze coverage.** In the OZ module `approve` is also a debit of the
spendable balance (it moves value into an escrow entry), so a wrapper that
exposes `approve` and `transferFrom` must gate them on frozen and paused
like `transfer` and `burn`. This demo's wrapper does not export them, which
is why its eight circuits are enough; a fuller wrapper needs the gates and
the deploy bytes.

### B2. Lending with the token as collateral

Same pattern: prove, freeze, record; the contract disburses a loan in a
native stablecoin it holds; repayment unfreezes; default (a deadline, or a
posted price crossing a threshold) lets anyone call `liquidate`, which seizes
the recorded collateral to the lender. Interest and loan-to-value run on the
recorded plaintext the borrower disclosed when proving it. The stablecoin
side is a native coin, which a contract can custody without difficulty.

The price is the weak point on ledger 8. Monolithic means the price is
posted **into the token contract** by an authority through one more circuit,
so liquidation rests on trusting whoever posts it (in this demo that would be
the issuer). On ledger 9 the token reads `oracle.price()` from a separate
contract, which relocates the trust rather than removing it.

### B3. What B cannot do

Swaps against a pool of the token itself (constraint 1), on any stack.

### B on ledger 8: monolithic

Everything above must be circuits **of the token contract**: two to four per
product, with eight already used and a single-transaction cap that admitted
ten and refused twelve. So a two-circuit product deploys on proven ground, a
three-circuit one fits by the model but is untested, and a four-circuit one
lands on twelve, which was refused. Anything beyond that goes in by
maintenance update after deploy, provided its ledger fields were declared at
deploy; the coin escrow, the price source and the token share one contract
either way.

### B on ledger 9: the token as orchestrator

The same products, split along the witness line:

- **Witness-free callees, deployed once and reused:** a coin escrow or order
  book (`deposit`, `release(orderId, to)`, `refund`), a lending pool
  (`disburse`, `repay`, `liquidateTo`), an oracle or price board (`price()`),
  a compliance registry (`isAllowed(id)`). Each holds native coins and public
  state, takes everything it needs as arguments, and can serve any number of
  tokens.
- **Thin orchestrating circuits on the token:** `buyListed(market, id)` does
  the internal seize-to-buyer and calls `market.release(id, sellerPayout)` in
  the same proof; `borrow(pool, oracle, amount)` proves and freezes, reads
  `oracle.price()`, calls `pool.disburse(amount, me)`; `repay(pool, coin)`
  calls `pool.repay(...)` and unfreezes.

Gains: the deploy budget stops being the design constraint (each product adds
one or two circuits to the token; the heavy logic lives elsewhere), the coin
side becomes reusable infrastructure shared across issuers, and settlement
stays atomic because the whole call graph is one transaction. Costs: we
found no documented way for a callee to learn which contract called it (the
reference and the standard library expose a contract's own address through
`kernel.self()`; the 0.34 notes say a callee "wants that caller's
`ContractAddress`" without saying where it comes from), so until that is
settled callee authorization has to travel in the arguments (a commitment or
proof the token circuit computes) or the callee must be safe to call by
anyone; one implementation per contract type per DApp; no call cycles.

## Option C: composability in the Ethereum direction

The ERC-20 pattern is "pool calls `token.transferFrom`". On Midnight that
requires the token to be a callee, which for a confidential token is
impossible on every stack (witness-free callee rule plus constraint 1). Two
things that do become possible on ledger 9 are adjacent to it:

- **A public-balance token as a callee.** OpenZeppelin's `FungibleToken`
  (not confidential) is the module whose `main` header lays out a migration
  plan for when C2C lands (transfers to contract addresses are refused today
  with "unsafe transfer"). Two things stand between that plan and pools in
  the familiar direction. First, `FungibleToken` authenticates its caller
  with a witness (`wit_FungibleTokenSK`), so as written it cannot be a
  callee at all under the witness-free rule; a callee version has to
  authenticate differently. Second, the natural replacement does not work:
  the 0.34 release notes state that `ownPublicKey()` "always names the
  transaction submitter, never the calling contract", so a pool calling
  `token.transferFrom` would authenticate as the human who submitted the
  transaction, not as the pool. Contract-as-holder needs the callee to learn
  the caller's `ContractAddress`, which the reference does not document; the
  release notes say a callee "wants that caller's ContractAddress", which
  points at passing it as an argument and trusting it. That is the same open
  dependency as the callee-authorization caveat in Option B on ledger 9.
  Confidential between people such a token is not.
- **Hybrid: confidential register plus a public, contract-held float.** A
  wrapper could keep confidential accounts for people and a plain public
  balance map for contracts (authenticated by the calling contract's
  address once the callee can learn it, or by an argument-carried proof).
  Value crossing between the two sides would be a disclosed amount, so pools
  see plaintext at their boundary while person-to-person stays hidden. This
  is a change to the token standard, not to this demo, and OpenZeppelin has
  not shipped it.

## Option D: the issuer as the venue

Primary issuance and redemption against fiat or a stablecoin, run by the
issuer, with mint and burn as the on-chain legs. This is what the demo already
does and what most RWA issuers do today. No composability, full control; the
ERC-7540 request-then-fulfil flow is the natural interface.

## The note model

Same constraints, same options, but the paper trail differs. OpenZeppelin's
note-model sources (branch `feat/hybrid-confidential-token` at `bdf8b5cd`,
2026-07-24: `ConfidentialNoteFungibleToken.compact`, its extensions and the
design doc `token/docs/hybrid-confidential-token.md`) say nothing about
contracts as holders, EOAs or c2c; the design doc's "Out of scope" list
covers review keys, recovery governance, allowlists, attestation, multi-asset
and wallet UX, not custody. The conclusion follows from the code rather than
from a statement: the core header says `transfer` and `burn` "are self-gated
(spending requires the owner's secret via `wit_SecretKey`)", the spend path
also needs `wit_InputNote` and `wit_Path`, and created notes "are returned
to the caller (a local, private result)" to be handed over out of band. A
contract has no private state to hold a spend secret, a note or a Merkle
path, and no way to receive a note handed over out of band, so a contract
cannot own notes for the same cryptographic reason a contract cannot own a
CFT balance. Every value-bearing note circuit uses witnesses, so the note
token can be a caller but never a callee for anything that moves a note;
read-only circuits, if a wrapper exported them, could be called. Wrap (consume a note, mint a coin;
receive a coin, deliver a note plus audit record) works as in A. The
freeze-prove pattern is natural per note: a note has a fixed value, so a
listing is "reveal this note's value to the contract and freeze its
nullifier", and settlement re-mints the note to the buyer. The seize circuit
today takes the authority secret as a witness; a DvP variant would authorize
the move from the recorded listing instead.

## Comparison

| | A: wrap | B on ledger 8: monolithic | B on ledger 9: orchestrator | C: hybrid public float | D: issuer venue |
|---|---|---|---|---|---|
| Wallet shows the asset | yes (wrapped) | no | no | no (public side is contract-only) | no |
| Other contracts custody it | as a coin | no | no; they custody the coin legs | the public float only | no |
| Freeze / seize preserved | at the gates only | yes | yes | on the confidential side | yes |
| Escrowed viewing keys still open it | not while wrapped | yes | yes | confidential side | yes |
| Amounts hidden | in Zswap, unauditable | disclosed per deal | disclosed per deal | public at the pool boundary | to the issuer |
| Swaps against a pool | any coin AMM | no | no (coin legs only) | yes, public side | no |
| Needs cross-contract calls | no | no | yes | yes, plus a standard change | no |
| Deploy budget pressure | +2 circuits (ten total, proven) | one product of two or three circuits per deploy tx, more by maintenance update | +1 or 2 per product on the token | n/a | none |
| Buildable and testable now | ledger 8, in the browser | ledger 8, in the browser | Stagenet, headless CLI only | no | ledger 8 |

## What stays out of reach on either stack

- **A confidential AMM**, hidden reserves and hidden trade sizes: a research
  problem everywhere (MPC, FHE or sealed-bid batch auctions). No Midnight
  primitive provides it.
- **A contract custodying the asset while it stays confidential.** Contracts
  keep no secrets; any contract-held balance is public by nature.
- **Pool-initiated token movements.** No value-bearing circuit of the token
  can be a callee; a contract can at most read from it.
- **A single-transaction swap of two parties' confidential balances.** Only
  one party's witnesses exist in a proof. Listing plus buyer-side settlement
  (B1) is the workaround, and it is atomic from the buyer's side.

## What can be built and tested right now

- **On ledger 8, in the browser, with 1AM or Lace:** Option A and one Option
  B product inside the token contract. Both fit the deploy budget.
- **On Stagenet, headless:** the orchestrator shape of Option B. This
  repository's contracts compile on toolchain 0.34 (the note branch carries
  `pragma >= 0.23`; the account model would move to OpenZeppelin `main`,
  which needs 0.34), and the `load-test/stagenet` harness in this workspace
  already runs the Stagenet SDK line (midnight-js 5 beta, wallet-sdk 2 beta,
  ledger-v9, proof server 9). A CLI e2e could deploy a witness-free coin
  market next to the token and settle a listing through a cross-contract
  call. What it cannot do is show the flow in a wallet: no consumer wallet
  exposes a Stagenet connector yet.
- **When Preview and Preprod move to ledger 9 and the wallets follow:** the
  headless orchestrator becomes the browser demo with no design change.

## Recommendation

- Now, to show "these tokens can live in a wallet and trade": **Option A** on
  ledger 8. Two circuits; the compliance trade-off is visible on one screen.
- Now, to show "these tokens can do finance without leaving compliance":
  **Option B1** on ledger 8, monolithic. Freeze, prove and seize as an escrow
  primitive is the result specific to a confidential register.
- In parallel, on Stagenet: prototype **B on ledger 9**, the token calling a
  witness-free coin market. It is the shape the design converges on, and it
  is buildable today without a wallet.
- Do not plan for the Ethereum direction. The token will not become a callee;
  the confidential asset stays in the register and the coins come to it.

## Sources

- Compact reference, "Contract types" and "Cross-contract calls" (including
  the witness-free callee rule, single-implementation and no-cycle limits):
  https://docs.midnight.network/compact/reference/compact-reference
- Compact standard library exports (shielded mint, receive, send; `kernel.self()`):
  https://docs.midnight.network/compact/standard-library/exports
- Compact toolchain 0.34.0 release notes (dated 2026-08-18 on the docs site;
  the GitHub release was published 2026-08-25). 0.33 added ledger 9,
  cross-contract calls and events; 0.34.0 lets callees perform shielded coin
  operations and states that `ownPublicKey()` names the transaction
  submitter, never the calling contract:
  https://docs.midnight.network/relnotes/compact/toolchain-0.34.0 and
  https://github.com/midnightntwrk/compact/releases/tag/compactc-v0.34.0
- Node-side weight rule: `pallets/midnight/src/lib.rs` (`check_weight`,
  `get_tx_weight`, `EXTRA_WEIGHT_TX_SIZE`) and
  `ledger/src/versions/common/mod.rs` (`get_transaction_cost`,
  `scale_normalized_cost`) in https://github.com/midnightntwrk/midnight-node;
  `NORMAL_DISPATCH_RATIO = 75%` and `BlockWeights::with_sensible_defaults(2 s)`
  in `runtime/src/lib.rs`. The live values (`maxExtrinsic` 64.99%, normal
  `maxTotal` 75%, `baseExtrinsic` 0.01%, empty-block mandatory weight 1.09%)
  were read from both nodes' `system.blockWeights` constant and
  `system.blockWeight` storage on 2026-09-16. Ledger-side
  normalization: `base-crypto/src/cost_model.rs` in
  https://github.com/midnightntwrk/midnight-ledger. Maintenance updates:
  `SingleUpdate::VerifierKeyInsert` in `ledger/src/structure.rs`.
- midnight-js "Dynamic cross-contract calls" (open PR for Q3 2026):
  https://github.com/midnightntwrk/midnight-js/pull/1307
- OpenZeppelin `main` ConfidentialFungibleToken header, "EOA-only" paragraph
  (lines 200-219 at commit `b871037`, 2026-09-02):
  https://github.com/OpenZeppelin/compact-contracts/blob/main/contracts/src/token/ConfidentialFungibleToken.compact#L200-L219
  and FungibleToken header (contract recipients refused until C2C):
  https://github.com/OpenZeppelin/compact-contracts/blob/main/contracts/src/token/FungibleToken.compact
- OpenZeppelin note model, branch `feat/hybrid-confidential-token` at
  `bdf8b5cd` (no custody statement; spend is witness-gated per the core
  header):
  https://github.com/OpenZeppelin/compact-contracts/blob/feat/hybrid-confidential-token/contracts/src/token/ConfidentialNoteFungibleToken.compact
  and the design doc
  https://github.com/OpenZeppelin/compact-contracts/blob/feat/hybrid-confidential-token/contracts/src/token/docs/hybrid-confidential-token.md
- Stagenet component line and its known issues: `load-test/stagenet/` in this
  workspace (midnight-js 5.0.0-beta, wallet-sdk 2.0.0-beta, ledger-v9, proof
  server 9, compactc 0.34.0)
- Preview retirement and Stagenet in a third-party wallet:
  https://github.com/Gero-Labs/gerowallet/pull/1027
- ERC-7943 uRWA: https://eips.ethereum.org/EIPS/eip-7943 ·
  ERC-3643: https://eips.ethereum.org/EIPS/eip-3643 ·
  ERC-7540: https://eips.ethereum.org/EIPS/eip-7540
