import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';

interface AddressBlockStats {
  totalBlocks: number;
  firstBlock: {
    blockNumber: number;
    transactionCount: number;
    totalValue: number;
  } | null;
  lastBlock: {
    blockNumber: number;
    transactionCount: number;
    totalValue: number;
  } | null;
}

// Query keys for address block stats
export const addressBlockStatsQueryKeys = {
  all: ['address-block-stats'] as const,
  detail: (address: string) => [...addressBlockStatsQueryKeys.all, address] as const,
};

// Hook for fetching address block stats
export const useAddressBlockStats = (address: string) => {
  return useQuery<AddressBlockStats>({
    queryKey: addressBlockStatsQueryKeys.detail(address),
    queryFn: async () => {
      const result = await api.blockchain.getAddressBlockStats(address);
      return result;
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}; 