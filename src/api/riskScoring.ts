import { RiskScoringResponse } from '../typings/riskScoring';

import { axiosInstance } from './api';

interface RiskScoringRequest {
  identifier: string;
  type: 'address' | 'transaction';
}

export const calculateRiskScore = async (identifier: string, type: 'address' | 'transaction'): Promise<RiskScoringResponse> => {
  const response = await axiosInstance.post<{ success: boolean; data: RiskScoringResponse }>('/risk-scoring/calculate', {
    identifier,
    type
  } as RiskScoringRequest);

  if (!response.data.success) {
    throw new Error('Failed to calculate risk score');
  }

  return response.data.data;
};

export const riskScoring = {
  calculateRiskScore,
};
