import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { api } from '../api/api';

import { transactionQueryKeys } from './useTransaction';

export const useTransactionPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchTransaction = useCallback(
    async (txid: string | undefined) => {
      if (!txid || typeof txid !== 'string') return;

      // Only prefetch if not already in cache
      const cached = queryClient.getQueryData(transactionQueryKeys.detail(txid));
      if (cached) return;

      await queryClient.prefetchQuery({
        queryKey: transactionQueryKeys.detail(txid),
        queryFn: async () => {
          const response = await api.blockchain.getTransaction(txid);
          return response;
        },
        staleTime: 30 * 1000, // 30 seconds
      });
    },
    [queryClient]
  );

  return { prefetchTransaction };
};