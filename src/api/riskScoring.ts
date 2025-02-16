import { axiosInstance } from './api';
import { RiskScores } from '../types/newRiskScoring';

interface RiskScoringRequest {
  identifier: string;
  type: 'address' | 'transaction';
}

export const calculateRiskScore = async (identifier: string, type: 'address' | 'transaction'): Promise<RiskScores> => {
  const response = await axiosInstance.post<{ success: boolean; data: RiskScores }>('/risk-scoring/calculate', {
    identifier,
    type
  } as RiskScoringRequest);

  if (!response.data.success) {
    throw new Error('Failed to calculate risk score');
  }

  return response.data.data;
};
