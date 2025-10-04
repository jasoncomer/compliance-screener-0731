import { useQuery } from '@tanstack/react-query';

import { api } from '../api/api';
import { IBtcAddress } from '../typings/BtcAddress';
import { RiskScoringResponse } from '../typings/riskScoring';

/**
 * Query keys for FlowTrace data
 */
export const flowtraceQueryKeys = {
  all: ['flowtrace'] as const,
  address: (address: string) => [...flowtraceQueryKeys.all, 'address', address] as const,
  transactions: (address: string, page: number, limit: number) =>
    [...flowtraceQueryKeys.all, 'transactions', address, page, limit] as const,
  summary: (address: string) => [...flowtraceQueryKeys.all, 'summary', address] as const,
  riskScore: (address: string) => [...flowtraceQueryKeys.all, 'risk-score', address] as const,
  attribution: (address: string) => [...flowtraceQueryKeys.all, 'attribution', address] as const,
};

/**
 * Hook to fetch address basic data
 */
export const useFlowtraceAddress = (address: string) => {
  return useQuery<IBtcAddress>({
    queryKey: flowtraceQueryKeys.address(address),
    queryFn: async () => {
      const result = await api.blockchain.getAddress(address);
      return result.data;
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch address transactions
 */
export const useFlowtraceTransactions = (address: string, page = 1, limit = 50) => {
  return useQuery({
    queryKey: flowtraceQueryKeys.transactions(address, page, limit),
    queryFn: async () => {
      return await api.blockchain.getAddressTransactions(address, { page, limit });
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch address summary (balance, totals)
 */
export const useFlowtraceSummary = (address: string) => {
  return useQuery({
    queryKey: flowtraceQueryKeys.summary(address),
    queryFn: async () => {
      return await api.blockchain.getAddressSummary(address);
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch risk score for an address
 * Shares cache with useRiskScore hook
 */
export const useFlowtraceRiskScore = (address: string) => {
  return useQuery<RiskScoringResponse>({
    queryKey: flowtraceQueryKeys.riskScore(address),
    queryFn: async () => {
      return await api.riskScoring.calculateRiskScore(address, 'address');
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // Only retry once for risk scores
  });
};

/**
 * Hook to fetch Bitcoin attribution data
 */
export const useFlowtraceAttribution = (address: string) => {
  return useQuery({
    queryKey: flowtraceQueryKeys.attribution(address),
    queryFn: async () => {
      return await api.blockchain.getBitcoinAttribution(address);
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - attribution data is more stable
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

/**
 * Composite hook that fetches all data needed for FlowTrace node expansion
 * This replaces the old expandNodeOptimized call
 */
export const useFlowtraceNodeData = (address: string, options?: {
  includeTransactions?: boolean;
  includeRiskScore?: boolean;
}) => {
  const { includeTransactions = true, includeRiskScore = true } = options || {};

  // Fetch all data in parallel
  const addressQuery = useFlowtraceAddress(address);
  const transactionsQuery = useFlowtraceTransactions(
    address,
    1,
    50,
  );
  const summaryQuery = useFlowtraceSummary(address);
  const riskScoreQuery = useFlowtraceRiskScore(address);
  const attributionQuery = useFlowtraceAttribution(address);

  // Combine loading states
  const isLoading = addressQuery.isLoading ||
    (includeTransactions && transactionsQuery.isLoading) ||
    summaryQuery.isLoading ||
    (includeRiskScore && riskScoreQuery.isLoading) ||
    attributionQuery.isLoading;

  // Combine error states
  const hasError = addressQuery.isError ||
    summaryQuery.isError;

  return {
    // Individual query results
    address: addressQuery.data,
    transactions: transactionsQuery.data,
    summary: summaryQuery.data,
    riskScore: riskScoreQuery.data,
    attribution: attributionQuery.data,

    // Aggregate states
    isLoading,
    hasError,

    // Individual loading states (for granular UI control)
    isLoadingAddress: addressQuery.isLoading,
    isLoadingTransactions: transactionsQuery.isLoading,
    isLoadingSummary: summaryQuery.isLoading,
    isLoadingRiskScore: riskScoreQuery.isLoading,
    isLoadingAttribution: attributionQuery.isLoading,

    // Refetch functions
    refetchAddress: addressQuery.refetch,
    refetchTransactions: transactionsQuery.refetch,
    refetchSummary: summaryQuery.refetch,
    refetchRiskScore: riskScoreQuery.refetch,
    refetchAttribution: attributionQuery.refetch,
  };
};
