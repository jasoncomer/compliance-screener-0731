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
}

export interface RiskDetail {
  factor: string;
  score: number;
  description: string;
  severity: 'high' | 'medium' | 'low';
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