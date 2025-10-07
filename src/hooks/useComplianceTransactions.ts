import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../api/api';
import { ComplianceTransactionResponse,IComplianceTransaction, TransactionFilters } from '../typings/compliance';

// Query keys
export const complianceQueryKeys = {
  all: ['compliance'] as const,
  transactions: () => [...complianceQueryKeys.all, 'transactions'] as const,
  transactionsList: (filters: TransactionFilters) => 
    [...complianceQueryKeys.transactions(), { filters }] as const,
  transaction: (id: string) => [...complianceQueryKeys.transactions(), id] as const,
};

// Hook for fetching compliance transactions
export const useComplianceTransactions = (filters: TransactionFilters) => {
  return useQuery<ComplianceTransactionResponse>({
    queryKey: complianceQueryKeys.transactionsList(filters),
    queryFn: () => api.compliance.getTransactions(filters),
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
    staleTime: 2 * 60 * 1000, // 2 minutes - fresher than default for compliance data
  });
};

// Hook for updating transaction status
export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, status }: { transactionId: string; status: string }) =>
      api.compliance.updateTransactionStatus(transactionId, status),
    onSuccess: (updatedTransaction: IComplianceTransaction) => {
      // Invalidate and refetch transactions list
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.transactions() });
      
      // Update specific transaction in cache if it exists
      queryClient.setQueryData(
        complianceQueryKeys.transaction(updatedTransaction._id),
        updatedTransaction
      );
    },
    onError: (error) => {
      console.error('Failed to update transaction status:', error);
    },
  });
};

// Hook for updating transaction assignee
export const useUpdateTransactionAssignee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, assignee }: { transactionId: string; assignee: string }) =>
      api.compliance.updateTransactionAssignee(transactionId, assignee),
    onSuccess: (updatedTransaction: IComplianceTransaction) => {
      // Invalidate and refetch transactions list
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.transactions() });
      
      // Update specific transaction in cache if it exists
      queryClient.setQueryData(
        complianceQueryKeys.transaction(updatedTransaction._id),
        updatedTransaction
      );
    },
    onError: (error) => {
      console.error('Failed to update transaction assignee:', error);
    },
  });
};

// Hook for bulk updating transaction assignees
export const useBulkUpdateTransactionAssignee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionIds, assignee }: { transactionIds: string[]; assignee: string }) =>
      api.compliance.bulkUpdateTransactionAssignee(transactionIds, assignee),
    onSuccess: () => {
      // Invalidate all transaction queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.transactions() });
    },
    onError: (error) => {
      console.error('Failed to bulk update transaction assignees:', error);
    },
  });
};

// Hook for bulk updating transaction status
export const useBulkUpdateTransactionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionIds, status }: { transactionIds: string[]; status: string }) =>
      api.compliance.bulkUpdateTransactionStatus(transactionIds, status),
    onSuccess: () => {
      // Invalidate all transaction queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: complianceQueryKeys.transactions() });
    },
    onError: (error) => {
      console.error('Failed to bulk update transaction status:', error);
    },
  });
};