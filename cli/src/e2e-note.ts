// End-to-end scenario for the note-model token against a real network
// (standalone Docker by default): deploy, mint, transfer, burn, auditor view,
// freeze, seize. One funding wallet, three note identities.
//
//   npm -w cft-demo-cli run e2e-note:standalone
import { NotePrivateState, formatUnits, paymentAddress, readNoteToken, shortPk } from 'cft-demo-contract';
import { selectConfig } from './common/config.js';
import { c, heading, log, ok, warn, withStatus } from './common/display.js';
import { buildWallet, ensureDust, nightBalance, waitForFunds, waitForSync } from './common/wallet.js';
import { NoteClient, deployNote, joinNote, makeNoteProviders } from './api-note.js';

const GENESIS_SEED = '0000000000000000000000000000000000000000000000000000000000000001';
const DECIMALS = 2;
const f = (v: bigint) => formatUnits(v, DECIMALS);

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
  const started = Date.now();

  heading(`Note token e2e on ${config.name}`);
  const wallet = await withStatus('Starting funding wallet', () => buildWallet(config, seed, 'funding wallet'));
  await withStatus('Syncing wallet', () => waitForSync(wallet.wallet));
  if ((await nightBalance(wallet.wallet)) === 0n) {
    warn(`Wallet has no NIGHT. Fund ${wallet.address} then wait...`);
    await withStatus('Waiting for NIGHT', () => waitForFunds(wallet.wallet));
  }
  await ensureDust(wallet);

  const deployerState = NotePrivateState.generate(true); // issuer + authority + auditor + supply
  const aliceState = NotePrivateState.generate();
  const bobState = NotePrivateState.generate();
  const aliceAddr = paymentAddress(aliceState);
  const bobAddr = paymentAddress(bobState);
  const deployerAddr = paymentAddress(deployerState);
  log(`alice pk ${shortPk(aliceAddr.pk)} · bob pk ${shortPk(bobAddr.pk)} · deployer pk ${shortPk(deployerAddr.pk)}`);

  heading('Deploy (5 circuits: mint k17, transfer k18, burn k17, seize k17, setFrozen k13)');
  const deployerProviders = await makeNoteProviders(config, wallet, `deployer-${Date.now()}`);
  const deployed = await withStatus('Deploying note token', () => deployNote(deployerProviders, deployerState));
  const address = deployed.deployTxData.public.contractAddress;
  ok(`contract address: ${c.bold}${address}${c.reset}`);
  const deployer = new NoteClient(deployerProviders, deployed);
  const aliceProviders = await makeNoteProviders(config, wallet, `alice-${Date.now()}`);
  const bobProviders = await makeNoteProviders(config, wallet, `bob-${Date.now()}`);
  const alice = new NoteClient(aliceProviders, await joinNote(aliceProviders, address, aliceState));
  const bob = new NoteClient(bobProviders, await joinNote(bobProviders, address, bobState));

  const show = async (label: string, who: NoteClient) => {
    const v = await who.notes();
    const live = v.notes.filter((n) => !n.spent);
    log(
      `${label.padEnd(9)} spendable=${f(v.spendable).padStart(9)}  frozen=${f(v.frozenValue).padStart(9)}  notes: ${live.map((n) => f(n.note.value) + (n.frozen ? '(F)' : '')).join(', ') || 'none'}`,
    );
  };
  const publicView = async () => {
    const t = readNoteToken(await deployer.ledger());
    log(`${c.gray}public ledger: ${t.commitments} commitments, ${t.nullifiers} nullifiers, ${t.deliveries} deliveries, ${t.frozen} frozen, ${t.seizures} seizures. No ids, no amounts.${c.reset}`);
  };

  heading('Mint (issuer → alice)');
  await withStatus('mint 1000.00 to alice', () => deployer.mint(aliceAddr, 100_000n));
  await show('alice', alice);
  await publicView();
  await expectFailure('alice minting', () => alice.mint(bobAddr, 1n), /holds no issuer role|Error executing circuit/);

  heading('Confidential transfer (alice → bob), fully private');
  await withStatus('alice transfer 250.50 to bob', () => alice.transfer(bobAddr, 25_050n));
  await show('alice', alice);
  await show('bob', bob);
  await publicView();
  await expectFailure('overspend', () => bob.transfer(aliceAddr, 99_900n), /insufficient spendable/);

  heading('Burn (bob)');
  await withStatus('bob burn 50.00', () => bob.burn(5_000n));
  await show('bob', bob);

  heading('Auditor view (audit key): every note, owner, amount, status');
  const trail = await deployer.audit();
  for (const t of trail) log(`  #${t.index} owner ${shortPk(t.ownerPk)} value ${f(t.note.value).padStart(8)} ${t.spent ? 'spent' : 'live '} ${t.frozen ? 'FROZEN' : ''}`);
  const bobLive = trail.find((t) => t.ownerPk === bobAddr.pk && !t.spent);
  if (!bobLive) throw new Error('auditor could not find bob live note');
  ok(`auditor identified bob's live note: ${f(bobLive.note.value)}`);

  heading('Freeze bob\'s note by nullifier (authority)');
  await withStatus('freeze', () => deployer.setFrozen(bobLive.nullifier, true));
  await show('bob', bob);
  await expectFailure('frozen bob spending', () => bob.transfer(aliceAddr, 1n), /insufficient spendable|frozen/);
  await expectFailure('alice freezing', () => alice.setFrozen(bobLive.nullifier, false), /holds no authority role|Error executing circuit/);

  heading('Seize bob\'s frozen note → deployer recovery (no cooperation, no key escrow)');
  await withStatus('seize', () => deployer.seize(bobLive, deployerAddr));
  await show('bob', bob);
  await show('deployer', deployer);
  await publicView();

  heading('Summary');
  const t = await deployer.token();
  log(`issuer ${shortPk(t.issuerPk)} · authority ${shortPk(t.authorityPk)} · commitments ${t.commitments} · nullifiers ${t.nullifiers} · seizures ${t.seizures}`);
  ok(`done in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  process.exit(0);
};

main().catch((e) => {
  console.error(`\n${c.red}e2e-note failed:${c.reset}`, e);
  process.exit(1);
});
