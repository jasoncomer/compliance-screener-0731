import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import { api } from '../api/api';
import { BtcTransaction } from '../typings/BtcTransaction';

export const transactionQueryKeys = {
  all: ['transaction'] as const,
  detail: (txid: string) => [...transactionQueryKeys.all, txid] as const,
};

interface UseTransactionOptions {
  enabled?: boolean;
  onSuccess?: (data: BtcTransaction) => void;
  onError?: (error: Error) => void;
}

export const useTransaction = (txid: string | undefined, options?: UseTransactionOptions) => {
  return useQuery<BtcTransaction, Error>({
    queryKey: transactionQueryKeys.detail(txid || ''),
    queryFn: async () => {
      if (!txid || typeof txid !== 'string') {
        throw new Error('Invalid transaction ID');
      }

      const response = await api.blockchain.getTransaction(txid);
      return response;
    },
    enabled: !!txid && typeof txid === 'string' && (options?.enabled !== false),
    staleTime: 30 * 1000, // 30 seconds - transactions are immutable once confirmed
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

export const usePrefetchTransaction = () => {
  const queryClient = useQueryClient();

  return async (txid: string) => {
    await queryClient.prefetchQuery({
      queryKey: transactionQueryKeys.detail(txid),
      queryFn: async () => {
        const response = await api.blockchain.getTransaction(txid);
        return response;
      },
      staleTime: 30 * 1000,
    });
  };
};