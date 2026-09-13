// Contract state decoded from the indexer by compact-js contains
// BoundedMerkleTrees whose internal nodes are not rehashed; any root or path
// computation on them fails with "attempted to take root of non-rehashed bmt".
// Wrapping the PublicDataProvider rehashes every tree in every returned state.
// Needed by the note token (its commitments live in a HistoricMerkleTree);
// harmless for the account-model CFT. Pattern from mnf-se-examples.
import type { PublicDataProvider } from '@midnight-ntwrk/midnight-js-types';

type StateValue = { type: string; value?: { rehash?: () => void }; entries?: StateValue[] };

const rehashStateValue = (sv: StateValue): void => {
  if (sv.type === 'boundedMerkleTree' && typeof sv.value?.rehash === 'function') sv.value.rehash();
  if (sv.type === 'array' && Array.isArray(sv.entries)) sv.entries.forEach(rehashStateValue);
};

const rehashContractState = <T extends { data?: unknown } | null>(cs: T): T => {
  const data = (cs as { data?: Map<string, StateValue> } | null)?.data;
  if (data && typeof data.values === 'function') for (const sv of data.values()) rehashStateValue(sv);
  return cs;
};

export const withMerkleTreeRehash = (inner: PublicDataProvider): PublicDataProvider => {
  const anyInner = inner as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>;
  const wrapped: Record<string, unknown> = { ...anyInner };
  for (const name of ['queryContractState', 'queryZSwapAndContractState', 'queryDeployContractState'] as const) {
    if (typeof anyInner[name] === 'function') {
      wrapped[name] = async (...args: unknown[]) => {
        const result = (await anyInner[name](...args)) as { contractState?: unknown } | null;
        if (result && typeof result === 'object' && 'contractState' in result && result.contractState) {
          rehashContractState(result.contractState as { data?: unknown });
          return result;
        }
        return rehashContractState(result as { data?: unknown } | null);
      };
    }
  }
  return wrapped as unknown as PublicDataProvider;
};
