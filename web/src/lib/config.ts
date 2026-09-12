import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export type NetworkKey = 'preview' | 'preprod' | 'standalone';

export interface NetworkConfig {
  readonly key: NetworkKey;
  readonly label: string;
  /** The id passed to the DApp connector's connect() and to midnight-js. */
  readonly networkId: 'preview' | 'preprod' | 'undeployed';
  readonly indexer: string;
  readonly indexerWS: string;
  readonly defaultProofServer: string;
}

const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174';

export const NETWORKS: Record<NetworkKey, NetworkConfig> = {
  preview: {
    key: 'preview',
    label: 'Preview',
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    defaultProofServer: 'http://127.0.0.1:6300',
  },
  preprod: {
    key: 'preprod',
    label: 'Preprod',
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    defaultProofServer: 'http://127.0.0.1:6300',
  },
  standalone: {
    key: 'standalone',
    label: 'Standalone (local Docker)',
    networkId: 'undeployed',
    indexer: `${origin}/api/v4/graphql`,
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    defaultProofServer: origin,
  },
};

export const applyNetworkId = (networkId: NetworkConfig['networkId']): void => {
  setNetworkId(networkId);
};
