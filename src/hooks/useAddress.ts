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
  console.log('useAddress - called with:', { address });
  
  return useQuery<IBtcAddress>({
    queryKey: addressQueryKeys.detail(address),
    queryFn: async () => {
      console.log('useAddress - fetching data for address:', address);
      const result = await api.blockchain.getAddress(address);
      console.log('useAddress - received data:', result);
      return result.data;
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}; 