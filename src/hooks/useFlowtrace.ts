import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../api/api';
import { FTConnection, FTNode } from '../views/Flowtrace/components';

// Query keys factory
export const flowtraceQueryKeys = {
  all: ['flowtrace'] as const,
  nodes: () => [...flowtraceQueryKeys.all, 'nodes'] as const,
  node: (address: string) => [...flowtraceQueryKeys.nodes(), address] as const,
  transactions: (address: string, page?: number, limit?: number) =>
    [...flowtraceQueryKeys.node(address), 'transactions', { page, limit }] as const,
  riskScore: (address: string) => [...flowtraceQueryKeys.node(address), 'risk'] as const,
  riskScores: (addresses: string[]) => [...flowtraceQueryKeys.all, 'risk-scores', addresses] as const,
  expansion: (nodeId: string, txIds: string[]) =>
    [...flowtraceQueryKeys.node(nodeId), 'expansion', txIds] as const,
};

// Types for API responses
interface NodeData {
  enhancedData: any;
  riskScores: Record<string, { overallRisk: number }>;
  summary: {
    balance?: string;
    usdValue?: number;
    txCount?: number;
    totalTransactions?: number;
    uniqueAddresses?: number;
    hasAttribution?: boolean;
  };
  transactions?: any[];
  address?: string;
}

interface UseFlowtraceNodeOptions {
  includeRiskScores?: boolean;
  includeTransactions?: boolean;
  enabled?: boolean;
  onSuccess?: (data: NodeData) => void;
  onError?: (error: Error) => void;
}

// Hook to fetch node data with caching
export const useFlowtraceNode = (
  address: string | undefined,
  options?: UseFlowtraceNodeOptions
) => {
  return useQuery<NodeData, Error>({
    queryKey: flowtraceQueryKeys.node(address || ''),
    queryFn: async () => {
      if (!address) throw new Error('Address is required');

      // Fetch data in parallel using blockchain and riskScoring APIs
      const [transactions, summary, riskScore, attribution] = await Promise.all([
        options?.includeTransactions
          ? api.blockchain.getAddressTransactions(address, { page: 1, limit: 50 })
          : Promise.resolve({ txs: [], pagination: { totalTxs: 0 } }),
        api.blockchain.getAddressSummary(address),
        options?.includeRiskScores
          ? api.riskScoring.calculateRiskScore(address, 'address').catch(() => null)
          : Promise.resolve(null),
        api.blockchain.getBitcoinAttribution(address).catch(() => null),
      ]);

      return {
        enhancedData: attribution ? [{
          address,
          attribution,
          entityProfile: {
            entityId: attribution.entity,
            entity_type: 'wallet',
            proper_name: attribution.entity
          }
        }] : [],
        riskScores: riskScore ? { [address]: riskScore } : {},
        summary: {
          balance: summary?.balance?.toString(),
          usdValue: summary?.balance,
          txCount: transactions?.pagination?.totalTxs,
          totalTransactions: transactions?.pagination?.totalTxs,
        },
        transactions: transactions?.txs,
        address,
      } as NodeData;
    },
    enabled: !!address && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

// Hook for fetching transactions with pagination
interface UseNodeTransactionsOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useNodeTransactions = (
  address: string | undefined,
  options?: UseNodeTransactionsOptions
) => {
  const { page = 1, limit = 50, enabled = true } = options || {};

  return useQuery({
    queryKey: flowtraceQueryKeys.transactions(address || '', page, limit),
    queryFn: async () => {
      if (!address) throw new Error('Address is required');

      const response = await api.blockchain.getAddressTransactions(address, { page, limit });
      return response;
    },
    enabled: !!address && enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

// Hook for batch fetching risk scores
export const useRiskScores = (addresses: string[], enabled = true) => {
  return useQuery({
    queryKey: flowtraceQueryKeys.riskScores(addresses),
    queryFn: async () => {
      if (!addresses.length) return {};

      // Fetch risk scores in parallel with limited concurrency
      const batchSize = 5;
      const results: Record<string, number> = {};

      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(async (address) => {
            const riskScore = await api.riskScoring.calculateRiskScore(address, 'address');
            return {
              address,
              risk: riskScore?.overallRisk,
            };
          })
        );

        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.risk !== undefined) {
            results[result.value.address] = Math.round(result.value.risk * 100);
          }
        });
      }

      return results;
    },
    enabled: addresses.length > 0 && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  });
};

// Hook for node expansion (when user clicks to expand a node)
interface NodeExpansionParams {
  address: string;
  txIds: string[];
  direction: 'in' | 'out' | 'both';
}

export const useNodeExpansion = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { nodes: FTNode[]; connections: FTConnection[] },
    Error,
    NodeExpansionParams
  >({
    mutationFn: async ({ address, txIds, direction }) => {
      // This would call the appropriate expansion method
      // For now, returning empty arrays as placeholder
      const nodes: FTNode[] = [];
      const connections: FTConnection[] = [];

      // Process the expansion results
      // This would contain the logic from FlowTracePage for processing expansion
      console.log('Expanding node:', address, txIds, direction);

      return { nodes, connections };
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: flowtraceQueryKeys.node(variables.address),
      });
    },
  });
};

// Hook to prefetch node data (for hover or anticipated navigation)
export const usePrefetchFlowtraceNode = () => {
  const queryClient = useQueryClient();

  return async (address: string) => {
    await queryClient.prefetchQuery({
      queryKey: flowtraceQueryKeys.node(address),
      queryFn: async () => {
        // Fetch data in parallel using blockchain and riskScoring APIs
        const [transactions, summary, riskScore, attribution] = await Promise.all([
          api.blockchain.getAddressTransactions(address, { page: 1, limit: 50 }),
          api.blockchain.getAddressSummary(address),
          api.riskScoring.calculateRiskScore(address, 'address').catch(() => null),
          api.blockchain.getBitcoinAttribution(address).catch(() => null),
        ]);

        return {
          enhancedData: attribution ? [{
            address,
            attribution,
            entityProfile: {
              entityId: attribution.entity,
              entity_type: 'wallet',
              proper_name: attribution.entity
            }
          }] : [],
          riskScores: riskScore ? { [address]: riskScore } : {},
          summary: {
            balance: summary?.balance?.toString(),
            usdValue: summary?.balance,
            txCount: transactions?.pagination?.totalTxs,
            totalTransactions: transactions?.pagination?.totalTxs,
          },
          transactions: transactions?.txs,
          address,
        };
      },
      staleTime: 2 * 60 * 1000,
    });
  };
};

// Hook to invalidate flowtrace data (useful after mutations)
export const useInvalidateFlowtrace = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: flowtraceQueryKeys.all }),
    invalidateNode: (address: string) =>
      queryClient.invalidateQueries({ queryKey: flowtraceQueryKeys.node(address) }),
    invalidateRiskScores: () =>
      queryClient.invalidateQueries({ queryKey: [...flowtraceQueryKeys.all, 'risk-scores'] }),
  };
};