# CFT Demo: OpenZeppelin's Confidential Fungible Token on Midnight

A small, complete application around OpenZeppelin's **ConfidentialFungibleToken
(CFT)** for Midnight: mint, burn, confidential transfer between accounts,
viewing keys, freeze, pause, and a viewing-key-gated seize. The web UI connects
to any Midnight DApp-connector wallet (1AM, Lace) and the CLI runs the same
flow headlessly against a local network for verification.

```
cft-demo/
  contract/   Compact contract (composes OZ CFT + PublicSupply + Ownable) and the
              shared TypeScript layer: witnesses, wallet-side crypto, ledger readers,
              simulator tests
  cli/        headless deploy + end-to-end scenario (seed wallet, local proof server)
  web/        Vite + React UI for 1AM / Lace via the DApp connector API v4
  docker/     proof server 8.1.0, and a full standalone node+indexer+prover stack
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
  pause in the wrapper, and a seize that works only when the issuer holds the
  account's viewing key. Without the key a seize is cryptographically
  impossible (the circuit cannot learn or prove the amount), so the demo makes
  key disclosure a condition of onboarding: `register` is allowlist-gated and
  the issuer's onboarding action stores the holder's viewing key.
- **Counterparty graph is public.** Amounts are hidden, who-paid-whom is not.
- **Wallet responsibilities are load-bearing.** A fresh CSPRNG randomness seed
  per transaction is mandatory (seed reuse leaks amount differences), and the
  wallet must keep the plaintext of its balance ciphertext to spend. This
  project's wallet layer does both; the OZ test witness does neither.
- **Balance recovery is bounded.** A wallet that loses its cache (or a viewer
  with only the viewing key) recovers a balance by bounded discrete log
  (2^32 units here). Memos are exact; the accumulated balance is not.
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

## The demo contract

`contract/src/cft-demo.compact` composes the vendored OZ modules:

| Circuit | Who | What |
|---|---|---|
| `setOnboarded(a, bool)` | issuer | allowlist maintenance; onboarding is where the issuer collects the holder's viewing key off-chain (KYC) |
| `register()` | onboarded accounts | registers EK-derived public key, balance = Enc(0); fails for accounts not onboarded |
| `sweep()` | holder | pending → spendable |
| `transfer(to, value)` | holder | confidential transfer; blocked if paused or either side frozen |
| `burn(value)` | holder | debit own balance, `totalSupply -= value` |
| `mint(to, value)` | issuer | `totalSupply += value`, credit `to` |
| `setFrozen(a, bool)` | issuer | maintain the frozen set |
| `setPaused(bool)` | issuer | circuit breaker for value movement |
| `seize(account, to)` | issuer | requires frozen account and the account's **viewing key** as a witness; proves `Dec(balance, EK) == amount`, zeroes the account, credits `to` the same amount (supply conserved, amount not disclosed) |

Pure helpers (`computeAccountId`, `derivePk`, `decryptMemo`, `decryptToPoint`,
`valuePoint`, `addCiphertexts`) run locally with no proof and back the wallet
and viewer code. Balances, memos, supply, frozen set and metadata are read
directly from the public ledger state.

## Running it

Prerequisites: Node 22, Docker, the `compact` devtools with toolchain 0.31.1
(`compact update 0.31.1`).

```bash
cd cft-demo
npm install
npm run build:contract          # compact compile +0.31.1 → keys/zkir/TS, then tsc
npm test                        # 11 simulator tests: mint/sweep/transfer/burn/freeze/pause/seize
```

### Headless end-to-end on a local network

```bash
npm run docker:standalone       # node 0.22.5 + indexer + proof server 8.0.3 (genesis wallet is funded)
npm run e2e:standalone          # deploys, registers 3 accounts, mints, transfers, burns,
                                # freezes, inspects with a viewing key, seizes, pauses
npm run docker:down
```

The same script runs on Preview or Preprod with a funded seed:
`SEED=<hex> npm run e2e:preview` (needs the proof server: `npm run docker:proof`).

Proof server versions matter: the dev node image (0.22.5) rejects proofs from
proof server 8.1.0 with ledger `Custom error: 170` (InvalidDustSpendProof), so
the standalone stack pins 8.0.3; the public networks (node 1.0.2) take 8.1.0.

### Web UI with 1AM or Lace

```bash
npm run docker:proof            # local proof server on :6300 (proving happens here)
npm run web                     # http://localhost:5174
```

1. Pick the wallet detected under `window.midnight.*` (1AM appears as `1am`,
   Lace as `mnLace`), pick the network, **Connect**. The wallet's unshielded
   address seeds a browser-local CFT identity (SK + viewing key).
2. **Deploy** a token (you become issuer) or **Join** an address someone gave
   you. Deployment from a CLI: `SEED=… npm -w cft-demo-cli run deploy:preview`.
3. Get **onboarded**: copy your viewing key (panel 3) and send it to the
   issuer, who pastes it into "Onboard holder" (panel 5). The issuer is
   onboarded automatically. Then **Register**, have the issuer **Mint** to your
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
6. Issuer: **Freeze**, then in panel 6 load the holder's stored viewing key,
   **Inspect**, **Seize** to a treasury account (must differ from the seized
   account). **Unfreeze**, **Pause**, **Unpause**.

Amounts are typed in tokens (`12.5`), converted with the token's decimals.
A CFT account is not the wallet address: connecting derives a per-wallet
confidential identity in the browser, and its `accountId` is what others send to.

Fees: with 1AM the wallet sponsors DUST (its ProofStation balances the tx);
with Lace the wallet needs DUST of its own.

Proving: after connecting, the app defaults to **proving in the wallet** when
the connector exposes `getProvingProvider` (1AM does its own proving), so no
proof server is needed and the UI can be hosted statically. Otherwise, or if
you pick "Proof server" in panel 1, proofs go to the HTTP proof server URL
(default `http://127.0.0.1:6300`, `npm run docker:proof`). The header shows
which mode is active. Docker is only required for the proof-server mode and
for the standalone network used by the headless e2e.

## How the wallet layer works

- **Private state** (`contract/src/witnesses.ts`) holds `SK`, `EK`, the
  plaintext cache, the per-transaction randomness seed, and, for the issuer,
  imported viewing keys plus recovered balances for `seize`. It is plain JSON
  and lives in midnight-js's level private-state store per wallet address.
- Before **every** transaction the app rotates the randomness seed; before
  every **debit** it syncs the spendable ciphertext's plaintext (cache, else
  recovery with its own viewing key) so `wit_PlaintextBalance` can answer.
- **Balances** (`contract/src/wallet.ts`): `pending` is derived exactly from
  the memos (it is always the sum of the newest k memos, checked against the
  ciphertext), for any amount. `spendable` comes from the wallet cache, else
  from the value the wallet expected after its own last move (verified against
  the ciphertext), else bounded recovery.
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
  `crypto/EcdhMask.compact`, `token/extensions/ConfidentialFungibleTokenPublicSupply.compact`)
- Midnight compatibility matrix: https://docs.midnight.network/relnotes/support-matrix
- Midnight DApp connector API: https://docs.midnight.network/api-reference/dapp-connector
- 1AM wallet developer page: https://1am.xyz/developers
- Block-limit issue tracked upstream: https://github.com/midnightntwrk/midnight-node/issues/1202
