import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export interface Config {
  readonly name: string;
  readonly networkId: 'undeployed' | 'preview' | 'preprod';
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

const PROOF_SERVER = process.env.PROOF_SERVER ?? 'http://127.0.0.1:6300';

export const CONFIGS: Record<string, Config> = {
  standalone: {
    name: 'standalone',
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    node: 'http://127.0.0.1:9944',
    proofServer: PROOF_SERVER,
  },
  preview: {
    name: 'preview',
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preview.midnight.network',
    proofServer: PROOF_SERVER,
  },
  preprod: {
    name: 'preprod',
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    node: 'https://rpc.preprod.midnight.network',
    proofServer: PROOF_SERVER,
  },
};

export const selectConfig = (name: string): Config => {
  const cfg = CONFIGS[name];
  if (!cfg) throw new Error(`Unknown network '${name}'. Use one of: ${Object.keys(CONFIGS).join(', ')}`);
  setNetworkId(cfg.networkId);
  return cfg;
};
