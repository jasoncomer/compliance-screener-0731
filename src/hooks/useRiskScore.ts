import { useQuery } from '@tanstack/react-query';
import { calculateRiskScore } from '../api/riskScoring';
import { RiskScoringResponse } from '../typings/riskScoring';

// Query keys for risk scores
export const riskScoreQueryKeys = {
  all: ['risk-score'] as const,
  detail: (address: string) => [...riskScoreQueryKeys.all, address] as const,
};

export const useRiskScore = (address: string) => {
  const { data: riskScore, isLoading, error, refetch } = useQuery<RiskScoringResponse>({
    queryKey: riskScoreQueryKeys.detail(address),
    queryFn: async () => {
      return await calculateRiskScore(address, 'address');
    },
    enabled: !!address && address.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    riskScore: riskScore || null,
    isLoading,
    error: error ? 'Failed to fetch risk score' : null,
    refetch: () => refetch(),
  };
}; 