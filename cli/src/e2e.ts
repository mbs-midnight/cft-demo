// End-to-end scenario against a real network (standalone Docker by default):
// deploy, register three CFT accounts, mint, sweep, transfer, burn, freeze,
// viewing-key inspection, seize, unfreeze, pause / unpause.
//
// One funding wallet pays DUST for everyone; each actor has its own CFT
// identity (SK / EK) and private-state store, which is the interesting part:
// CFT accounts are independent of the wallet that pays fees.
//
//   npm -w cft-demo-cli run e2e:standalone
//   SEED=<hex> npm -w cft-demo-cli run e2e:preview
import { CftPrivateState, accountIdFromSecretKey, formatAmount, fromHex, parseAmount, toHex } from 'cft-demo-contract';
import { selectConfig } from './common/config.js';
import { c, heading, log, ok, warn, withStatus } from './common/display.js';
import { buildWallet, dustBalance, ensureDust, nightBalance, waitForFunds, waitForSync } from './common/wallet.js';
import { CftClient, deploy, join, makeProviders } from './api.js';

const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const expectFailure = async (label: string, fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
    throw new Error(`${label}: expected failure but the call succeeded`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!pattern.test(msg)) throw new Error(`${label}: unexpected error: ${msg}`);
    ok(`${label} rejected as expected ${c.gray}(${pattern.source})${c.reset}`);
  }
};

const main = async () => {
  const networkName = arg('network') ?? 'standalone';
  const config = selectConfig(networkName);
  const seed = process.env.SEED ?? (networkName === 'standalone' ? GENESIS_SEED : undefined);
  if (!seed) throw new Error('SEED env var (hex) is required for public networks');
  const DECIMALS = 2;
  const started = Date.now();

  heading(`CFT demo e2e on ${config.name}`);
  const wallet = await withStatus('Starting funding wallet', () => buildWallet(config, seed, 'funding wallet'));
  await withStatus('Syncing wallet', () => waitForSync(wallet.wallet));
  let night = await nightBalance(wallet.wallet);
  if (night === 0n) {
    warn(`Wallet has no NIGHT. Fund ${wallet.address} then wait...`);
    night = await withStatus('Waiting for NIGHT', () => waitForFunds(wallet.wallet));
  }
  log(`NIGHT: ${formatAmount(night, 6)}`);
  const dust = await ensureDust(wallet);
  log(`DUST: ${formatAmount(dust, 15)}`);

  // Three independent CFT identities sharing one fee-paying wallet.
  const issuerState = CftPrivateState.generate();
  const aliceState = CftPrivateState.generate();
  const bobState = CftPrivateState.generate();
  const idOf = (s: CftPrivateState) => toHex(accountIdFromSecretKey(fromHex(s.secretKeyHex)));
  log(`issuer accountId: ${idOf(issuerState)}`);
  log(`alice  accountId: ${idOf(aliceState)}`);
  log(`bob    accountId: ${idOf(bobState)}`);

  heading('Deploy');
  const issuerProviders = await makeProviders(config, wallet, `issuer-${Date.now()}`);
  const deployed = await withStatus('Deploying CFT (name=Confidential Dollar, symbol=cUSD, decimals=2)', () =>
    deploy(issuerProviders, issuerState, 'Confidential Dollar', 'cUSD', BigInt(DECIMALS)),
  );
  const address = deployed.deployTxData.public.contractAddress;
  ok(`contract address: ${c.bold}${address}${c.reset}`);
  const issuer = new CftClient(issuerProviders, deployed);

  const aliceProviders = await makeProviders(config, wallet, `alice-${Date.now()}`);
  const bobProviders = await makeProviders(config, wallet, `bob-${Date.now()}`);
  const alice = new CftClient(aliceProviders, await join(aliceProviders, address, aliceState));
  const bob = new CftClient(bobProviders, await join(bobProviders, address, bobState));
  const issuerId = idOf(issuerState);
  const aliceId = idOf(aliceState);
  const bobId = idOf(bobState);

  const show = async (label: string, who: CftClient) => {
    const b = await who.balances();
    const f = (v: bigint | undefined) => (v === undefined ? '?' : formatAmount(v, DECIMALS)).padStart(10);
    log(
      `${label.padEnd(7)} spendable=${f(b.spendable)} (${b.spendableSource})  pending=${f(b.pending)} (${b.pendingSource})` +
        (b.frozen ? `  ${c.red}[FROZEN]${c.reset}` : ''),
    );
  };
  const supply = async () => log(`totalSupply (public): ${formatAmount((await issuer.token()).totalSupply, DECIMALS)} cUSD`);

  heading('Onboard (KYC: holders hand the issuer their viewing keys) + register');
  await expectFailure('alice registering before onboarding', () => alice.register(), /not onboarded/);
  await withStatus('issuer onboard alice (stores her viewing key, allowlists her id)', async () => issuer.onboard(await alice.exportViewingKey()));
  await withStatus('issuer onboard bob', async () => issuer.onboard(await bob.exportViewingKey()));
  for (const [name, who] of [['issuer', issuer], ['alice', alice], ['bob', bob]] as const) {
    const r = await withStatus(`register ${name}`, () => who.register());
    log(`tx ${r.txId} @ block ${r.blockHeight}`);
  }
  log(`allowlist: ${(await issuer.token()).allowlist.length} accounts`);

  heading('Mint (issuer → alice)');
  await withStatus('mint 1000.00 cUSD to alice', () => issuer.mint(aliceId, parseAmount('1000.00', DECIMALS)));
  await supply();
  await show('alice', alice);
  log(`alice memo history (decrypted with her viewing key): ${(await alice.memos()).map((m) => formatAmount(m, DECIMALS)).join(', ')}`);
  await expectFailure('alice minting', () => alice.mint(bobId, 1n), /not the owner/);

  heading('Sweep + confidential transfer (alice → bob)');
  await withStatus('alice sweep', () => alice.sweep());
  await withStatus('alice transfer 250.50 cUSD to bob', () => alice.transfer(bobId, parseAmount('250.50', DECIMALS)));
  await show('alice', alice);
  await show('bob', bob);
  log(`bob memo history: ${(await bob.memos()).map((m) => formatAmount(m, DECIMALS)).join(', ')}`);
  await expectFailure('overspend', () => bob.transfer(aliceId, parseAmount('999', DECIMALS)), /insufficient balance/);

  heading('Burn (bob)');
  await withStatus('bob sweep', () => bob.sweep());
  await withStatus('bob burn 50.00 cUSD', () => bob.burn(parseAmount('50.00', DECIMALS)));
  await show('bob', bob);
  await supply();

  heading('Freeze bob');
  await withStatus('issuer freeze bob', () => issuer.freeze(bobId));
  await show('bob', bob);
  await expectFailure('frozen bob sending', () => bob.transfer(aliceId, 1n), /account frozen/);
  await expectFailure('sending to frozen bob', () => alice.transfer(bobId, 1n), /account frozen/);
  await expectFailure('frozen bob burning', () => bob.burn(1n), /account frozen/);

  heading('Viewing key: collected at onboarding, issuer inspects');
  const bobVk = (await issuer.storedViewingKey(bobId))!;
  log(`stored viewing key for bob: ${JSON.stringify(bobVk)}`);
  const inspected = await issuer.inspect(bobVk);
  log(
    `issuer sees bob: spendable=${formatAmount(inspected.spendable ?? -1n, DECIMALS)} pending=${formatAmount(inspected.pending ?? -1n, DECIMALS)} ` +
      `memos=[${inspected.memos.map((m) => formatAmount(m, DECIMALS)).join(', ')}]`,
  );
  await expectFailure(
    'seize with a wrong viewing key',
    () => issuer.seize({ accountId: bobVk.accountId, viewingKey: CftPrivateState.generate().encryptionKeyHex }, issuerId),
    /could not recover|ek\/pk mismatch/,
  );

  heading('Seize bob → issuer treasury');
  const seized = await withStatus('issuer seize', () => issuer.seize(bobVk, issuerId));
  ok(`seized ${formatAmount(seized.amount, DECIMALS)} cUSD in tx ${seized.txId}`);
  await show('bob', bob);
  await show('issuer', issuer);
  await supply();
  await withStatus('issuer sweep', () => issuer.sweep());
  await show('issuer', issuer);

  heading('Unfreeze, pause, unpause');
  await withStatus('issuer unfreeze bob', () => issuer.unfreeze(bobId));
  await withStatus('issuer pause', () => issuer.pause());
  await expectFailure('transfer while paused', () => alice.transfer(bobId, 1n), /paused/);
  await withStatus('issuer unpause', () => issuer.unpause());
  await withStatus('alice transfer 1.00 cUSD to (unfrozen) bob', () => alice.transfer(bobId, parseAmount('1.00', DECIMALS)));
  await show('alice', alice);
  await show('bob', bob);

  heading('Summary');
  const token = await issuer.token();
  log(`${token.name} (${token.symbol}), decimals ${token.decimals}, issuer ${token.issuerAccountId}`);
  log(`totalSupply ${formatAmount(token.totalSupply, DECIMALS)}, onboarded ${token.allowlist.length}, registered ${token.registered}, frozen ${token.frozen.length}, paused ${token.paused}`);
  log(`DUST left: ${formatAmount(await dustBalance(wallet.wallet), 15)}`);
  ok(`done in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  process.exit(0);
};

main().catch((e) => {
  console.error(`\n${c.red}e2e failed:${c.reset}`, e);
  process.exit(1);
});
