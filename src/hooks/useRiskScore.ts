import { useState, useEffect } from 'react';
import { calculateRiskScore } from '../api/riskScoring';
import { RiskScoringResponse } from '../typings/riskScoring';

interface UseRiskScoreReturn {
  riskScore: RiskScoringResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useRiskScore = (address: string): UseRiskScoreReturn => {
  const [riskScore, setRiskScore] = useState<RiskScoringResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiskScore = async () => {
    if (!address) {
      setRiskScore(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scores = await calculateRiskScore(address, 'address');
      setRiskScore(scores);
    } catch (err) {
      console.error('Error fetching risk score:', err);
      setError('Failed to fetch risk score');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskScore();
  }, [address]);

  return {
    riskScore,
    isLoading,
    error,
    refetch: fetchRiskScore
  };
}; 