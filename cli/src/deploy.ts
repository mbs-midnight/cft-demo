// Deploy a CFT to a public network from a seed wallet and print the contract
// address for the web UI. The issuer identity (SK / EK) is written to
// cli/.state/<network>/issuer-identity.json; import it into the browser if you
// want the web UI to act as issuer, or keep issuing from this CLI.
//
//   SEED=<hex> npm -w cft-demo-cli run deploy:preview -- --name "Confidential Dollar" --symbol cUSD --decimals 2
import fs from 'node:fs';
import path from 'node:path';
import { CftPrivateState, accountIdFromSecretKey, fromHex, toHex } from 'cft-demo-contract';
import { selectConfig } from './common/config.js';
import { heading, log, ok, warn, withStatus } from './common/display.js';
import { buildWallet, ensureDust, nightBalance, waitForFunds, waitForSync } from './common/wallet.js';
import { deploy, makeProviders } from './api.js';

const arg = (name: string, fallback: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const main = async () => {
  const config = selectConfig(arg('network', 'preview'));
  const seed = process.env.SEED;
  if (!seed) throw new Error('SEED env var (32-byte hex) is required');

  heading(`Deploy CFT on ${config.name}`);
  const wallet = await withStatus('Starting wallet', () => buildWallet(config, seed, 'wallet'));
  await withStatus('Syncing', () => waitForSync(wallet.wallet));
  if ((await nightBalance(wallet.wallet)) === 0n) {
    warn(`No NIGHT. Fund ${wallet.address} from https://faucet.${config.name}.midnight.network/ and wait...`);
    await withStatus('Waiting for NIGHT', () => waitForFunds(wallet.wallet));
  }
  await ensureDust(wallet);

  const stateDir = path.resolve('.state', config.name);
  fs.mkdirSync(stateDir, { recursive: true });
  const identityPath = path.join(stateDir, 'issuer-identity.json');
  let issuer: CftPrivateState;
  if (fs.existsSync(identityPath)) {
    const saved = JSON.parse(fs.readFileSync(identityPath, 'utf8')) as { secretKeyHex: string; encryptionKeyHex: string };
    issuer = CftPrivateState.fromSecrets(saved.secretKeyHex, saved.encryptionKeyHex);
    log(`reusing issuer identity from ${identityPath}`);
  } else {
    issuer = CftPrivateState.generate();
    fs.writeFileSync(
      identityPath,
      JSON.stringify({ secretKeyHex: issuer.secretKeyHex, encryptionKeyHex: issuer.encryptionKeyHex }, null, 2),
      { mode: 0o600 },
    );
    log(`new issuer identity saved to ${identityPath} (keep it secret)`);
  }
  log(`issuer accountId: ${toHex(accountIdFromSecretKey(fromHex(issuer.secretKeyHex)))}`);

  const providers = await makeProviders(config, wallet, 'issuer');
  const name = arg('name', 'Confidential Dollar');
  const symbol = arg('symbol', 'cUSD');
  const decimals = BigInt(arg('decimals', '2'));
  const deployed = await withStatus(`Deploying ${name} (${symbol}, ${decimals} decimals)`, () =>
    deploy(providers, issuer, name, symbol, decimals),
  );
  const address = deployed.deployTxData.public.contractAddress;
  fs.appendFileSync(path.join(stateDir, 'deployments.txt'), `${new Date().toISOString()} ${address} ${name} ${symbol} ${decimals}\n`);
  ok(`contract address: ${address}`);
  log('Paste it into the web UI ("Join") on the same network.');
  process.exit(0);
};

main().catch((e) => {
  console.error('deploy failed:', e);
  process.exit(1);
});
