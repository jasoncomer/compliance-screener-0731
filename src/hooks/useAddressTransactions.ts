import { useQuery } from '@tanstack/react-query';
import { getAddressTransactions } from '../api/blockchain/address';
import { BtcTransaction } from '../typings/BtcTransaction';

interface GetAddressTransactionsResponseData {
  txs: BtcTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTxs: number;
    limit: number;
  }
}

// Query keys for address transactions
export const addressTransactionQueryKeys = {
  all: ['address-transactions'] as const,
  list: (address: string, page: number, limit: number) => 
    [...addressTransactionQueryKeys.all, address, { page, limit }] as const,
};

// Hook for fetching address transactions
export const useAddressTransactions = (address: string, page: number = 1, limit: number = 10) => {
  return useQuery<GetAddressTransactionsResponseData>({
    queryKey: addressTransactionQueryKeys.list(address, page, limit),
    queryFn: async () => {
      const result = await getAddressTransactions(address, { page, limit });
      return result;
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}; 