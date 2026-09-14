# CFT Demo: OpenZeppelin's Confidential Fungible Token on Midnight

A small, complete application around OpenZeppelin's confidential tokens for
Midnight, in both of their models: the **ConfidentialFungibleToken (CFT)**
account model (mint, burn, confidential transfer, permissionless registration
with viewing-key escrow, viewing keys, freeze, pause, seize of any frozen
account) and the draft **note model**
(fully private graph, mandatory audit channel, freeze and seize by nullifier).
The web UI connects to any Midnight DApp-connector wallet (1AM, Lace), shows
side by side what an explorer sees and what a key holder sees, and the CLI runs
both flows headlessly against a local network for verification.

```
cft-demo/
  contract/
    src/cft-demo.compact        account model: OZ CFT + PublicSupply + Ownable + compliance
    src/cft-note.compact        note model: OZ ConfidentialNoteFungibleToken regulated preset
    src/oz/, src/oz-note/       vendored OpenZeppelin modules (unmodified)
    src/{witnesses,crypto,wallet}.ts   account-model wallet layer
    src/note/                   note-model wallet layer
    src/bmt-rehash.ts           indexer Merkle-tree rehash wrapper
    src/*.test.ts               27 simulator tests
    src/managed/                compiled output, committed (Vercel cannot run compact)
  cli/        headless deploy + two end-to-end scenarios (seed wallet, local proof server)
  web/        Vite + React UI for 1AM / Lace via the DApp connector API v4
  docker/     proof server 8.1.0, and a standalone node+indexer+prover stack (Preview versions)
  docs/       end-to-end logs from the local network
```

## What the CFT standard is

`ConfidentialFungibleToken` is OpenZeppelin's account-based token module for
Compact whose **balances are ElGamal ciphertexts** on the Jubjub curve instead
of public integers. It is the Midnight analogue of the "confidential ERC-20"
family (OpenZeppelin's own `ERC7984` on EVM), and it is not one of Midnight's
native shielded (Zswap) tokens: it is a smart-contract token with an
encrypted balance map.

Key design points, as the module documents them:

- **Identity.** An account is `accountId = persistentHash(SK)`; SK is a
  32-byte secret the wallet supplies as a witness. Accounts are independent
  of the Midnight wallet that pays fees.
- **Encryption key = viewing key.** A second secret `EK` derives an ElGamal
  public key registered on-chain. Whoever holds EK can decrypt everything
  about the account but cannot spend, because spending also needs SK.
- **Balances.** Two ciphertexts per account: `spendable` and `pending`.
  Credits (mint, transfer in) land in `pending`; only the owner moves them to
  `spendable` with `sweep()`. This stops third parties from churning the
  spendable ciphertext under an in-flight spend proof.
- **Memo channel.** Every credit pushes an ECDH one-time-pad memo the
  recipient decrypts directly with EK, so amounts of any size are delivered
  exactly with no discrete-log search.
- **Spending proves a plaintext.** To debit, the wallet supplies the cached
  plaintext of its current balance ciphertext; the circuit checks
  `Dec(ct, EK) == plaintext` and `plaintext >= value`, then subtracts
  homomorphically. A wrong key or a wrong plaintext makes the proof fail.
- **Escrow allowances.** `approve` / `transferFrom` / `burnFrom` exist with a
  private cap (this demo does not export them to stay inside the deploy
  byte budget).
- **Supply.** The base is supply-free; `ConfidentialFungibleTokenPublicSupply`
  adds a **public** `totalSupply`, so every mint and burn amount is revealed
  through the supply delta.
- **Composition contract.** Every caller-authenticating circuit returns the
  caller's `accountId`, so a wrapper can gate on it (this is how freeze is
  enforced here).

### What is public and what is hidden

| Public | Hidden |
|---|---|
| sender and recipient `accountId` on every transfer | transfer amounts |
| `totalSupply`, hence every mint and burn amount | individual balances |
| that an account registered, is frozen, has N memos | memo contents (amounts) |
| the seize event and its treasury recipient | the seized amount |

### Limitations (from the module header and this project's findings)

- **Not audited, alpha.** OpenZeppelin ships it as `0.3.0-alpha` / `0.4.0-alpha`.
- **Single receiver, no auditor copy, no freeze, no seize** in the base. OZ
  explicitly defers these to companion modules. This demo adds freeze and
  pause in the wrapper, and a seize that needs the account's viewing key.
  Without the key a seize is cryptographically impossible (the circuit cannot
  learn or prove the amount), so the demo escrows the key at registration:
  `register` is permissionless, but the same proof encrypts the caller's
  viewing key to a compliance key fixed at deployment and shows it is the key
  behind the public key being registered. Receiving requires registration, so
  every holder, including a wallet the issuer has never heard of, can be
  frozen and seized: the confidential counterpart of ERC-7943's
  `forceTransfer` and ERC-3643's forced transfers, without an allowlist.
- **Counterparty graph is public.** Amounts are hidden, who-paid-whom is not.
- **Wallet responsibilities are load-bearing.** A fresh CSPRNG randomness seed
  per transaction is mandatory (seed reuse leaks amount differences), and the
  wallet must keep the plaintext of its balance ciphertext to spend. This
  project's wallet layer does both; the OZ test witness does neither.
- **Balances are not directly readable, even by their owner.** The balance
  ciphertext is exponential ElGamal, so opening it yields `g^v`, not `v`. A
  wallet must remember its plaintext. This project layers the recovery (see
  "How the wallet layer works"): cache, own expected values, exact memo sums,
  issuer supply reconciliation, bounded discrete log (2^32 units), and finally
  a holder-typed value that is verified before use.
- **EOA only.** Contracts cannot hold a CFT balance (no private state to
  custody EK).
- **Concurrency.** Two credits to the same recipient in one block conflict.
- **Memo griefing.** Anyone can spam value-1 credits to grow a victim's memo
  list; only the owner can clear it.
- **Deploy byte budget.** The value circuits are SHA-256-heavy (k=13..16).
  Preview's ledger allows 50,000 `bytes_written` per block and every exported
  circuit adds roughly 2.7 KB (verifier key plus operation) to the deploy.
  Measured on the identical local stack: a ten-circuit deploy wrote 27,076
  bytes (54% of the block limit) and was accepted; a twelve-circuit one
  (about 32.5 KB) was rejected with "Transaction would exhaust the block
  limits", so a single transaction is held well under the whole block. The
  issuer toggles are therefore single boolean circuits: nine circuits total,
  about 24 KB.
- **Stack pinning.** OZ `main` (0.4.0-alpha) requires Compact language 0.26,
  compiler 0.34, compact-runtime 0.19, midnight-js 5.0.0-beta, ledger 9, which
  today only Stagenet runs. Preview, Preprod and Mainnet are on compiler
  0.31.1 / runtime 0.16 / midnight-js 4.1.1 / ledger 8, and so is the 1AM
  wallet. This project vendors OZ tag **v0.3.0-alpha.2**, the last CFT release
  for that stack. The only functional difference versus main is the
  `JubjubScalar` type annotation added in 0.4.

### Use cases

Tokenized deposits and stablecoins, payroll and B2B settlement, fund units,
loyalty and internal money: anything where the **issuer needs a public supply
attestation and compliance hooks** (issuer-gated mint, freeze, pause, seizure
under a disclosed viewing key) while **holders need amount privacy** from
other participants. Viewing keys give auditors, tax authorities or the issuer
read access per account without a global backdoor.

## Two token models in one demo

| | Account model (`cft-demo.compact`) | Note model (`cft-note.compact`) |
|---|---|---|
| OZ source | `ConfidentialFungibleToken`, tag v0.3.0-alpha.2 | `ConfidentialNoteFungibleToken` + extensions, branch `feat/hybrid-confidential-token` (draft) |
| State | encrypted balance per public accountId | notes (value, nonce) in a Merkle tree, spent by nullifier |
| Public sees | who paid whom, total supply, freeze flags, one escrow ciphertext per account | commitments, nullifiers, ciphertexts only; supply encrypted |
| Amounts | hidden (mint/burn leak via supply) | hidden, including mint and burn |
| Compliance | per-account: viewing key escrowed at (permissionless) registration, freeze, seize of any frozen account | structural: mandatory audit channel; authority freezes/seizes single notes with no key escrow |
| Viewing | the register proof escrows the viewing key to the compliance key | audit key opens every output by construction |
| Circuits | 8 (k up to 16), deploy ~25 KB | 5 (transfer k=18), deploy ~12 KB; prover keys 222 MB |
| Wallet | cache + memos, one balance | scan deliveries, one input note per spend, change note |

Pick the model by whether the transaction graph may be public. The web UI
deploys either (panel 2, "model") and detects which one an address is when
joining. The note-model deployer holds the issuer, authority, audit and
supply-key roles; a real deployment separates them.

Note-model specifics: a payment address is a spend key plus a delivery key
(panel 3, "copy address"); there is no registration. A payment consumes one
note and returns change as a new note, so the largest single payment is the
largest note you hold. Proving a transfer (k=18) takes about a minute on a
local proof server; the wallet has to fetch an 85 MB prover key first.
Headless check: `npm run e2e-note:standalone`.

## What is OpenZeppelin's and what is this project's

### From OpenZeppelin (vendored, unmodified, MIT)

Everything under `contract/src/oz/` (account model, tag `v0.3.0-alpha.2`) and
`contract/src/oz-note/` (note model, branch `feat/hybrid-confidential-token`
at `bdf8b5cd`, 2026-07-24, draft and unaudited), copied from
`OpenZeppelin/compact-contracts`:

| File | What it provides |
|---|---|
| `token/ConfidentialFungibleToken.compact` | The CFT itself: ElGamal balance map, pending/spendable split, `register`, `sweep`, `transfer`, the `_mint` / `_burn` building blocks, escrow allowances, the memo channel, and its four witness declarations |
| `token/extensions/ConfidentialFungibleTokenPublicSupply.compact` | Public `totalSupply` with `_addSupply` / `_subSupply` |
| `crypto/ElGamal.compact` | Exponential ElGamal over Jubjub: encrypt, homomorphic add/sub, key derivation, `assertDecryptsTo` |
| `crypto/EcdhMask.compact` | The one-time-pad memo scheme that delivers exact amounts to the recipient |
| `access/Ownable.compact`, `utils/Utils.compact` | Witness-derived owner identity, used for the issuer |

That is the standard. Everything the token *is* cryptographically (how
balances are hidden, how a spend is proven, how a recipient learns an amount)
comes from there. These files are not edited; the only difference from OZ
`main` is a type annotation OZ added later.

### Written for this project

- **Note wrapper** (`contract/src/cft-note.compact`) and **note wallet layer**
  (`contract/src/note/`): five-circuit surface over OZ's regulated preset;
  identities and payment addresses, delivery scanning, input-note selection,
  the auditor's view, and the witnesses (fresh randomness per call, Merkle
  path from the live ledger). Plus the Merkle-tree rehash wrapper the indexer
  decode needs (`contract/src/bmt-rehash.ts`).
- **Contract wrapper** (`contract/src/cft-demo.compact`): composes the OZ
  modules and adds the compliance policy the CFT deliberately leaves to the
  deployer: viewing-key escrow inside `register` (permissionless; the proof
  binds the escrowed scalar to the registered public key and encrypts it to
  the compliance key); issuer-gated `mint` and holder `burn`, each paired
  with the supply extension; `setFrozen`, checked on both sides of a transfer
  via OZ's returned-caller-id pattern; `setPaused`; `seize`, which takes the
  frozen account's viewing scalar (opened from the escrow) as a witness and
  proves it is the account's key and opens the balance to the claimed amount
  before moving it; and the pure helpers the wallet uses (`viewingScalar`,
  `openEscrow`, `decryptMemo`, `decryptToPoint`, `valuePoint`, ...).
- **Wallet layer** (`contract/src/witnesses.ts`, `crypto.ts`, `wallet.ts`):
  OZ ships only a test witness with a fixed seed and no wallet. This is the
  production-style counterpart its module header says an integration must
  build: private state and witnesses, per-transaction seed rotation,
  memo-based pending balances, candidate-verified spendable balances,
  bounded discrete-log recovery, escrow opening and verification, viewing-key
  export/import, formatting.
- **Tests** (`contract/src/cft-demo.test.ts`): 17 simulator tests over the
  composed contract.
- **CLI** (`cli/`): seed-wallet lifecycle (adapted from the mnf-se-examples
  reference), the midnight-js client, the deploy script, the end-to-end
  scenario.
- **Web app** (`web/`): DApp connector integration for 1AM and Lace,
  wallet-or-server proving, the React UI (guide, issuer panel, viewing-key
  audit and seize flow, the "what the chain sees" observer).
- **Infrastructure**: Docker files pinned to the Preview component versions,
  Vercel config, this README.

### The boundary

Swap this wrapper out and everything in `contract/src/oz/` is still a working
CFT; swap OZ out and nothing here works. Two design decisions are this
project's rather than the standard's: escrowing the viewing key to a
compliance key inside the registration proof, and defining seize as "prove the
amount with the escrowed key, then move it", one concrete way to fill the gap
OZ documents.

## The demo contract

`contract/src/cft-demo.compact` composes the vendored OZ modules:

| Circuit | Who | What |
|---|---|---|
| `register()` | anyone | registers the EK-derived public key, balance = Enc(0), and writes `escrow[id] = Enc_compliance(viewing scalar)`, proving `g^scalar` equals the key just registered |
| `sweep()` | holder | pending → spendable |
| `transfer(to, value)` | holder | confidential transfer; blocked if paused or either side frozen |
| `burn(value)` | holder | debit own balance, `totalSupply -= value` |
| `mint(to, value)` | issuer | `totalSupply += value`, credit `to` |
| `setFrozen(a, bool)` | issuer | maintain the frozen set |
| `setPaused(bool)` | issuer | circuit breaker for value movement |
| `seize(account, to)` | issuer | requires a frozen account; the issuer's wallet opens the account's escrow with the compliance secret and supplies the viewing scalar `s` and the amount; the proof checks `g^s == pk` and `Dec(balance, s) == amount`, zeroes the account, credits `to` the same amount (supply conserved, amount not disclosed) |

The constructor takes `(name, symbol, decimals, issuer, compliancePk)`. The
demo passes the issuer's own encryption public key as the compliance key, so
one browser plays both roles; a production deployment would pass a separate
key (a regulator's, or a threshold key) and the issuer alone could not read
balances.

The escrow is the ECDH mask OZ uses for memos, applied to the viewing scalar:
`{ephemeralPk: g^e, ct: s + KDF(compliancePk^e, "CFTDemo_escrow_v1")}`.
What is escrowed is `s = secretToScalar(EK)`, a hash of the 32-byte EK, which
is everything a viewer needs (memos and balances decrypt with `s`) and is what
"viewing key" means throughout the wallet API and exports.

Pure helpers (`computeAccountId`, `derivePk`, `viewingScalar`, `openEscrow`,
`decryptMemo`, `decryptToPoint`, `valuePoint`, `addCiphertexts`) run locally
with no proof and back the wallet and viewer code. Balances, memos, supply,
escrow, frozen set and metadata are read directly from the public ledger
state.

## Running it

Prerequisites: Node 22, Docker, the `compact` devtools with toolchain 0.31.1
(`compact update 0.31.1`).

```bash
cd cft-demo
npm install
npm run build:contract          # compact compile +0.31.1 → keys/zkir/TS, then tsc
npm test                        # 27 simulator tests: 17 account model, 10 note model
```

### Headless end-to-end on a local network

```bash
npm run docker:standalone       # node 1.0.2 + indexer 4.3.5 + proof server 8.1.0 (genesis wallet is funded)
npm run e2e:standalone          # account model: deploy, register (keys escrowed), mint, sweep,
                                # transfer, burn, a wallet the issuer never met, freeze, open its
                                # escrow, inspect, seize, pause
npm run e2e-note:standalone     # note model: deploy, mint, private transfer, burn, audit trail,
                                # freeze by nullifier, seize
npm run docker:down
```

Both scripts run on Preview or Preprod with a funded seed:
`SEED=<hex> npm run e2e:preview` (needs the proof server: `npm run docker:proof`).

The local stack is pinned to the same component versions as Preview. The
older `midnight-node:0.22.5` image used by other example repos rejects every
transaction built with ledger-v8 8.1.0 with `Custom error: 170`
(InvalidDustSpendProof); client ledger and node must match. The images are the
`-arm64` builds; on x86 use the plain tags. Logs of passing runs are in `docs/`.

### Web UI with 1AM or Lace

```bash
npm run docker:proof            # optional: local proof server on :6300, only for proof-server mode
npm run web                     # http://localhost:5174
```

1. Pick the wallet detected under `window.midnight.*` (1AM appears as `1am`,
   Lace as `mnLace`), pick the network, **Connect**. The wallet's unshielded
   address seeds a browser-local CFT identity (SK + viewing key).
2. **Deploy** a token (you become issuer) or **Join** an address someone gave
   you. Deployment from a CLI: `SEED=… npm -w cft-demo-cli run deploy:preview`.
3. **Register** (panel 3; no permission needed: the proof also escrows your
   viewing key to the compliance key), have the issuer **Mint** to your
   `accountId`, **Sweep**, **Send confidentially** to another wallet's
   `accountId`, **Burn**.
4. **Copy viewing key** and paste it into the viewer panel of any other
   connected browser: memos and balances decrypt there, and a claimed balance
   can be verified against the ciphertext.
5. Panel 7, **What the chain sees**, fills itself after every transaction:
   a two-column view of what an explorer can read (circuit name, the account
   ids involved, fee, total supply, opaque ciphertexts) next to what the
   viewing-key holder reads (amounts, balances, credit history). The Account
   tab does the same for any accountId.
6. Issuer: **Freeze** (one account) or **Pause** (the whole token) in panel 5,
   which lists every registered account. Seize lives in panel 6: pick any
   account ("open key → panel 6" on its row, or type its `accountId`): the
   browser decrypts its escrow with the compliance key, inspects it, and
   **Seize** moves the balance into a treasury account that differs from the
   seized one. The holder is never asked for anything. The Seize box lists the
   three conditions (frozen, balance known, distinct treasury) and which are
   met.
7. Note model: choose "Note model" when deploying (panel 2; joining detects
   the model). Panel 3 shows your notes and your **payment address** (spend
   key + delivery key) instead of an accountId; there is no registration.
   Panel 4 pays privately (one note per payment, change comes back), panel 5
   mints and, for the authority, freezes or seizes any live note from the
   audit trail. A "How the note model works" panel explains commitments,
   nullifiers, deliveries and audit records.

Things the UI does for you, and their edge cases:

- **Spendable balance.** Shown with its source: cache, verified expected value
  after your own move, sum of memos (never-spent account), supply
  reconciliation (compliance-key holder only: total supply minus every other
  registered account's balance, opened from the escrows), or bounded recovery. If none of
  those resolves, a field asks for the figure; a wrong value is refused, since
  it is checked against the ciphertext.
- **Private state per wallet and contract.** Your identity (SK, viewing key)
  is in localStorage per wallet address; the cache, expected values and the
  viewing keys opened from escrows are in the wallet's private-state store per
  wallet address and contract. Rejoining keeps all of it (see the midnight-js
  note below), and an opened key that goes missing is simply opened again from
  the chain.
- **Errors.** Ledger `Custom error: 170` means the node rejected the DUST fee
  proof the wallet attached (stale wallet DUST state, or a wallet/prover on a
  different ledger version than the network); the banner explains it. "Would
  exhaust the block limits" means a deploy has too many circuits.

Amounts are typed in tokens (`12.5`), converted with the token's decimals.
A CFT account is not the wallet address: connecting derives a per-wallet
confidential identity in the browser, and its `accountId` is what others send to.

On a phone: mobile browsers cannot host wallet extensions, so open the hosted
URL inside the **1AM app's built-in dApp browser** (it has an address bar and
injects the connector there). The page detects a mobile browser without a
wallet and shows these steps. The `webisoftSoftware/midnight-mobile` repo is a
wallet runtime for building React Native wallets, not something a web DApp
uses.

Fees: with 1AM the wallet sponsors DUST (its ProofStation balances the tx);
with Lace the wallet needs DUST of its own.

Proving: after connecting, the app defaults to **proving in the wallet** when
the connector exposes `getProvingProvider` (1AM does its own proving), so no
proof server is needed and the UI can be hosted statically. Otherwise, or if
you pick "Proof server" in panel 1, proofs go to the HTTP proof server URL
(default `http://127.0.0.1:6300`, `npm run docker:proof`). The header shows
which mode is active. Docker is only required for the proof-server mode and
for the standalone network used by the headless e2e.

## Hosting the web UI (Vercel)

`vercel.json` at the repo root does the whole build: it installs dev
dependencies, builds the contract package, then the web app, and serves
`web/dist`. The compiled contract (`contract/src/managed`, TypeScript bindings,
ZKIR and 72 MB of proving keys) is committed because Vercel cannot run the
Compact compiler and the wallet fetches prover keys from the hosted site.

Vercel scopes npm to the `web` workspace, so `web` declares every package it
needs and its `vercel-build` script builds the contract first. The bundle is
written to `web/dist` and copied to `dist` at the repo root, so the output is
found whether Vercel resolves paths from the repo root or from `web`. Project
settings: Root Directory empty, Framework Preset "Other"; everything else comes
from `vercel.json`. After `npm run build:contract` locally, commit the
regenerated `contract/src/managed` so the hosted keys match the contract.

Hosted, the UI needs no server of its own: the indexer is public, the wallet
signs and submits, and proving runs in the wallet when it offers it (1AM). The
"Proof server" mode still points at `127.0.0.1:6300`, i.e. the visitor's own
machine; use it only for local development.

## How the wallet layer works

- **Private state** (`contract/src/witnesses.ts`) holds `SK`, `EK`, the
  plaintext cache, expected spendable values after own moves, the
  per-transaction randomness seed, and, for the issuer, the holders' viewing
  keys plus recovered balances for `seize`. It is plain JSON and lives in
  midnight-js's level private-state store per wallet address and contract.
- **midnight-js pitfall.** `findDeployedContract` overwrites the stored private
  state whenever `initialPrivateState` is passed together with
  `privateStateId`. Every join here first reads the store and passes an initial
  state only when nothing is stored yet; otherwise a rejoin wipes the cache and
  the stored viewing keys.
- Before **every** transaction the app rotates the randomness seed; before
  every **debit** it syncs the spendable ciphertext's plaintext (cache, else
  recovery with its own viewing key) so `wit_PlaintextBalance` can answer.
- **Balances** (`contract/src/wallet.ts`): `pending` is derived exactly from
  the memos (it is always the sum of the newest k memos, checked against the
  ciphertext), for any amount. `spendable` is resolved in order: wallet cache;
  values the wallet expected after its own last moves; the sum of all memos
  (exact for an account that swept and never spent); for the compliance-key
  holder, total supply minus every other account's balance opened from the
  escrows; bounded recovery; finally a holder-typed value. Each candidate is accepted
  only if `verifyBalance` shows it is the ciphertext's plaintext.
- **Escrow** (`contract/src/wallet.ts`, `openEscrowedKey`): the compliance
  holder decrypts `escrow[id]` with its EK through the pure `openEscrow`, and
  accepts the result only if `g^s` equals the account's registered public key
  (a wrong compliance key opens to garbage and is rejected locally, the same
  check the `seize` circuit enforces). Opened keys are cached in the private
  state under `viewingKeys` and feed `wit_ViewingScalar`; the holder's own
  registration answers that witness from its EK.
- **Note wallet** (`contract/src/note/`): identities are a spend key
  (`pk = Hf(sk)`) and a delivery scalar (`encPk = g^encSk`); a payment address
  is both. Notes are found by opening every delivery with the delivery secret
  and keeping those whose commitment under our `pk` is in the tree; spent
  status is the nullifier's presence. Spends select one input note (smallest
  that covers the amount) and set it as the `wit_InputNote` witness; the
  Merkle path witness is read from the live ledger, which needs the rehash
  wrapper after indexer decode. The auditor opens every audit record with the
  audit secret; the authority freezes or seizes by the nullifier derived there.
- **Recovery** (`contract/src/crypto.ts`): a ciphertext is decrypted to `g^v`
  through the pure `decryptToPoint` and `v` is recovered by baby-step
  giant-step on `@noble/curves`' Jubjub (verified to match the runtime's curve
  arithmetic), 2^16 baby steps, up to 2^32 units. Above that the UI asks the
  holder for the figure and verifies it before caching it; a viewer can do the
  same with a holder-claimed spendable.

## Version pins

Everything is pinned to the Preview / Preprod / Mainnet compatibility matrix
as of September 2026: Compact toolchain 0.31.1 (language 0.23), compact-runtime
0.16.0, compact-js 2.5.1, midnight-js 4.1.1, ledger-v8 8.1.0, dapp-connector-api
4.0.1, wallet-sdk-facade 3.0.0, proof server 8.1.0. OpenZeppelin modules are
vendored from `OpenZeppelin/compact-contracts` tag `v0.3.0-alpha.2` (MIT,
license in `contract/src/oz/LICENSE`).

## Sources

- OpenZeppelin Contracts for Compact: https://github.com/OpenZeppelin/compact-contracts
  (`contracts/src/token/ConfidentialFungibleToken.compact`, `crypto/ElGamal.compact`,
  `crypto/EcdhMask.compact`, `token/extensions/ConfidentialFungibleTokenPublicSupply.compact`;
  note model on branch `feat/hybrid-confidential-token`, design doc
  `contracts/src/token/docs/hybrid-confidential-token.md`)
- RWA compliance standards the escrow design mirrors: ERC-7943 uRWA
  (`setFrozen`, `forceTransfer`, `canTransfer`) https://eips.ethereum.org/EIPS/eip-7943;
  ERC-3643 https://eips.ethereum.org/EIPS/eip-3643; ERC-7540 asynchronous vaults
  (exit-side control for RWA redemptions) https://eips.ethereum.org/EIPS/eip-7540
- 1AM mobile wallet (in-app dApp browser): https://apps.apple.com/app/1am-wallet/id6761093596
- Midnight compatibility matrix: https://docs.midnight.network/relnotes/support-matrix
- Midnight DApp connector API: https://docs.midnight.network/api-reference/dapp-connector
- 1AM wallet developer page: https://1am.xyz/developers
- Block-limit issue tracked upstream: https://github.com/midnightntwrk/midnight-node/issues/1202
