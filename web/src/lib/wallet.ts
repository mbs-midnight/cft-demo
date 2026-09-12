// DApp connector (API v4) integration. Works with any wallet that injects
// itself under `window.midnight.<id>`: 1AM (`window.midnight['1am']`), Lace
// (`window.midnight.mnLace`), and others. The wallet balances the unbound
// transaction (adds DUST for fees, or sponsors them, as 1AM does), signs and
// submits it. The DApp never sees wallet keys.
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProvider, WalletProvider, UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import {
  type Binding,
  type CoinPublicKey,
  type EncPublicKey,
  type FinalizedTransaction,
  type Proof,
  type SignatureEnabled,
  Transaction,
} from '@midnight-ntwrk/ledger-v8';

export type DetectedWallet = { id: string; api: InitialAPI };

export const detectWallets = (): DetectedWallet[] => {
  const midnight = (window as Window & { midnight?: Record<string, unknown> }).midnight;
  if (!midnight) return [];
  return Object.entries(midnight)
    .filter(([, v]) => v && typeof v === 'object' && typeof (v as InitialAPI).connect === 'function')
    .map(([id, api]) => ({ id, api: api as InitialAPI }));
};

export const walletDisplayName = (w: DetectedWallet): string =>
  w.api.name || (w.id === '1am' ? '1AM' : w.id === 'mnLace' ? 'Lace' : w.id);

const toHex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string): Uint8Array => {
  const clean = hex.replace(/^0x/, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
};

export interface ConnectedWallet {
  id: string;
  name: string;
  api: ConnectedAPI;
  unshieldedAddress: string;
  coinPublicKey: CoinPublicKey;
  encryptionPublicKey: EncPublicKey;
  /** Proof server advertised by the wallet's configuration, if any. */
  proverServerUri?: string;
  canProveInWallet: boolean;
}

export const connectWallet = async (w: DetectedWallet, networkId: string): Promise<ConnectedWallet> => {
  const api = await w.api.connect(networkId);
  const [shielded, unshielded, configuration] = await Promise.all([
    api.getShieldedAddresses(),
    api.getUnshieldedAddress(),
    api.getConfiguration().catch(() => undefined),
  ]);
  if (configuration && configuration.networkId && configuration.networkId !== networkId) {
    throw new Error(`Wallet is on '${configuration.networkId}', app wants '${networkId}'. Switch the wallet network.`);
  }
  return {
    id: w.id,
    name: walletDisplayName(w),
    api,
    unshieldedAddress: unshielded.unshieldedAddress,
    coinPublicKey: shielded.shieldedCoinPublicKey as CoinPublicKey,
    encryptionPublicKey: shielded.shieldedEncryptionPublicKey as EncPublicKey,
    proverServerUri: configuration?.proverServerUri ?? undefined,
    canProveInWallet: typeof (api as Partial<ConnectedAPI>).getProvingProvider === 'function',
  };
};

/** midnight-js WalletProvider + MidnightProvider on top of the connector. */
export const connectorProviders = (w: ConnectedWallet): WalletProvider & MidnightProvider => ({
  getCoinPublicKey: () => w.coinPublicKey,
  getEncryptionPublicKey: () => w.encryptionPublicKey,
  async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
    const { tx: balanced } = await w.api.balanceUnsealedTransaction(toHex(tx.serialize()));
    return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balanced)) as Transaction<
      SignatureEnabled,
      Proof,
      Binding
    >;
  },
  async submitTx(tx: FinalizedTransaction): Promise<string> {
    await w.api.submitTransaction(toHex(tx.serialize()));
    return tx.identifiers()[0];
  },
});

export const dustBalance = async (w: ConnectedWallet): Promise<{ balance: bigint; cap: bigint } | undefined> => {
  try {
    return await w.api.getDustBalance();
  } catch {
    return undefined;
  }
};
