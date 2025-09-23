import { useQuery } from '@tanstack/react-query';

import { api } from '../api/api';
import { IBtcAddress } from '../typings/BtcAddress';

// Query keys for address data
export const addressQueryKeys = {
  all: ['address'] as const,
  detail: (address: string) => [...addressQueryKeys.all, address] as const,
};

// Hook for fetching address data
export const useAddress = (address: string) => {
  return useQuery<IBtcAddress>({
    queryKey: addressQueryKeys.detail(address),
    queryFn: async () => {
      const result = await api.blockchain.getAddress(address);
      return result.data;
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}; 