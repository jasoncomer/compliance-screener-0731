import { RiskDetail } from "../../types/riskScoring";

export interface RiskScores {
  transactionRisk: number;
  entityRisk: number;
  jurisdictionRisk: number;
  overallRisk: number;
  details: {
    transaction: RiskDetail[];
    entity: RiskDetail[];
    jurisdiction: RiskDetail[];
  };
  historicalData: HistoricalData[];
  entityInfo?: EntityInfo;
  transactionInfo?: TransactionInfo;
  analysisType: 'address' | 'transaction';
}

export interface TransactionInfo {
  txHash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  blockNumber: number;
  gasUsed: number;
  gasPrice: string;
  status: 'success' | 'failed';
  riskFactors: {
    amount: RiskFactor;
    sender: RiskFactor;
    receiver: RiskFactor;
    pattern: RiskFactor;
    timing: RiskFactor;
  };
}

export interface RiskFactor {
  score: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
  details?: string[];
}

export interface HistoricalData {
  date: string;
  overallRisk: number;
}

export interface EntityInfo {
  proper_name?: string;
  entity_id?: string;
  entity_type?: string;
  logo?: string;
  url?: string;
  ceo?: string;
  key_personnel?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_twitter?: string;
  contact_telegram?: string;
  year_founded?: string;
  description_merged?: string;
  social_media_profiles?: string[];
  entity_tags?: string[];
  associated_countries?: string[];
  kyc_req?: boolean;
  centralized?: boolean;
  dead?: boolean;
} 