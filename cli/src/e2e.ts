// End-to-end scenario against a real network (standalone Docker by default):
// deploy, permissionless registration (viewing keys escrowed on-chain), mint,
// sweep, transfer, burn, a wallet in the wild that the issuer never met, freeze,
// escrow-opened viewing-key inspection, seize, unfreeze, pause / unpause.
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

  // Four independent CFT identities sharing one fee-paying wallet. Carol is
  // "in the wild": she never talks to the issuer, she just receives tokens.
  const issuerState = CftPrivateState.generate();
  const aliceState = CftPrivateState.generate();
  const bobState = CftPrivateState.generate();
  const carolState = CftPrivateState.generate();
  const idOf = (s: CftPrivateState) => toHex(accountIdFromSecretKey(fromHex(s.secretKeyHex)));
  log(`issuer accountId: ${idOf(issuerState)}`);
  log(`alice  accountId: ${idOf(aliceState)}`);
  log(`bob    accountId: ${idOf(bobState)}`);
  log(`carol  accountId: ${idOf(carolState)} (wild wallet)`);

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
  const carolProviders = await makeProviders(config, wallet, `carol-${Date.now()}`);
  const alice = new CftClient(aliceProviders, await join(aliceProviders, address, aliceState));
  const bob = new CftClient(bobProviders, await join(bobProviders, address, bobState));
  const carol = new CftClient(carolProviders, await join(carolProviders, address, carolState));
  const issuerId = idOf(issuerState);
  const aliceId = idOf(aliceState);
  const bobId = idOf(bobState);
  const carolId = idOf(carolState);

  const show = async (label: string, who: CftClient) => {
    const b = await who.balances();
    const f = (v: bigint | undefined) => (v === undefined ? '?' : formatAmount(v, DECIMALS)).padStart(10);
    log(
      `${label.padEnd(7)} spendable=${f(b.spendable)} (${b.spendableSource})  pending=${f(b.pending)} (${b.pendingSource})` +
        (b.frozen ? `  ${c.red}[FROZEN]${c.reset}` : ''),
    );
  };
  const supply = async () => log(`totalSupply (public): ${formatAmount((await issuer.token()).totalSupply, DECIMALS)} cUSD`);

  heading('Register (permissionless; each registration escrows the viewing key to the compliance key)');
  for (const [name, who] of [['issuer', issuer], ['alice', alice], ['bob', bob]] as const) {
    const r = await withStatus(`register ${name}`, () => who.register());
    log(`tx ${r.txId} @ block ${r.blockHeight}`);
  }
  {
    const t = await issuer.token();
    log(`registered ${t.registered}, escrowed ${t.escrowed}; compliance key ${t.complianceKey.slice(0, 12)}… (held by the issuer's EK here)`);
  }

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

  heading('A wallet in the wild: carol registers herself and gets paid by bob');
  await withStatus('carol register (no contact with the issuer)', () => carol.register());
  await withStatus('bob transfer 100.00 cUSD to carol', () => bob.transfer(carolId, parseAmount('100.00', DECIMALS)));
  await withStatus('carol sweep', () => carol.sweep());
  await withStatus('bob transfer 20.50 cUSD to carol (stays pending)', () => bob.transfer(carolId, parseAmount('20.50', DECIMALS)));
  await show('carol', carol);
  log(`issuer has a stored key for carol: ${(await issuer.storedViewingKey(carolId)) ? 'yes' : 'no'}`);

  heading('Freeze carol (any registered id, known or not)');
  await withStatus('issuer freeze carol', () => issuer.freeze(carolId));
  await show('carol', carol);
  await expectFailure('frozen carol sending', () => carol.transfer(aliceId, 1n), /account frozen/);
  await expectFailure('sending to frozen carol', () => alice.transfer(carolId, 1n), /account frozen/);
  await expectFailure('frozen carol burning', () => carol.burn(1n), /account frozen/);

  heading('Compliance key opens the escrow: issuer inspects carol without her cooperation');
  const carolVk = await withStatus('open carol\'s escrow with the compliance key', () => issuer.escrowedViewingKey(carolId));
  log(`opened viewing key for carol: ${JSON.stringify(carolVk)}`);
  log(`matches what carol's own wallet would export: ${carolVk.viewingKey === (await carol.exportViewingKey()).viewingKey}`);
  const inspected = await issuer.inspect(carolVk);
  log(
    `issuer sees carol: spendable=${formatAmount(inspected.spendable ?? -1n, DECIMALS)} pending=${formatAmount(inspected.pending ?? -1n, DECIMALS)} ` +
      `memos=[${inspected.memos.map((m) => formatAmount(m, DECIMALS)).join(', ')}]`,
  );
  await expectFailure(
    'seize with a wrong viewing key',
    () => issuer.seize({ accountId: carolId, viewingKey: CftPrivateState.viewingKeyHex(CftPrivateState.generate()) }, issuerId),
    /could not recover|could not open|does not match the account/,
  );
  await expectFailure('alice opening the escrow', () => alice.escrowedViewingKey(carolId), /does not hold the compliance key/);

  heading('Seize carol → issuer treasury');
  const seized = await withStatus('issuer seize', () => issuer.seizeEscrowed(carolId, issuerId));
  ok(`seized ${formatAmount(seized.amount, DECIMALS)} cUSD in tx ${seized.txId}`);
  await show('carol', carol);
  await show('issuer', issuer);
  await supply();
  await withStatus('issuer sweep', () => issuer.sweep());
  await show('issuer', issuer);

  heading('Unfreeze, pause, unpause');
  await withStatus('issuer unfreeze carol', () => issuer.unfreeze(carolId));
  await withStatus('issuer pause', () => issuer.pause());
  await expectFailure('transfer while paused', () => alice.transfer(bobId, 1n), /paused/);
  await withStatus('issuer unpause', () => issuer.unpause());
  await withStatus('alice transfer 1.00 cUSD to (unfrozen) bob', () => alice.transfer(bobId, parseAmount('1.00', DECIMALS)));
  await show('alice', alice);
  await show('bob', bob);

  heading('Summary');
  const token = await issuer.token();
  log(`${token.name} (${token.symbol}), decimals ${token.decimals}, issuer ${token.issuerAccountId}`);
  log(`totalSupply ${formatAmount(token.totalSupply, DECIMALS)}, registered ${token.registered}, escrowed ${token.escrowed}, frozen ${token.frozen.length}, paused ${token.paused}`);
  log(`DUST left: ${formatAmount(await dustBalance(wallet.wallet), 15)}`);
  ok(`done in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  process.exit(0);
};

main().catch((e) => {
  console.error(`\n${c.red}e2e failed:${c.reset}`, e);
  process.exit(1);
});
