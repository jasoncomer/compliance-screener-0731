import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { IBtcAddressSummary } from '../typings/BtcAddress';

// Query keys for address summary
export const addressSummaryQueryKeys = {
  all: ['address-summary'] as const,
  detail: (address: string) => [...addressSummaryQueryKeys.all, address] as const,
};

// Hook for fetching address summary
export const useAddressSummary = (address: string) => {
  return useQuery<IBtcAddressSummary>({
    queryKey: addressSummaryQueryKeys.detail(address),
    queryFn: async () => {
      const result = await api.blockchain.getAddressSummary(address);
      return result;
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}; 