import { SOTV2 } from "./interfaces";

// Base type for measuring any kind of risk
interface RiskFactor {
  id: string;  // Unique identifier for the risk factor
  score: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
  details?: Record<string, any>;
}

// Specific risk types extend the base RiskFactor
interface EntityRiskFactor extends RiskFactor {
  entityType: string;
  tags: string[];
  modifiers: Array<{
    type: string;
    impact: number | 'Maximum';
  }>;
}

interface JurisdictionRiskFactor extends RiskFactor {
  countries: string[];
  individualScores: number[];
}

interface TransactionRiskFactor extends RiskFactor {
  type: 'amount' | 'sender' | 'receiver' | 'pattern' | 'timing';
  hops?: Array<{
    txHash: string;
    riskScore: number;
    hopLevel: number;
    weight: number;
  }>;
}

// Historical data point
interface RiskDataPoint {
  date: string;
  score: number;
}

// Entity metadata
interface EntityMetadata {
  no_kyc_req: boolean;
  centralized: boolean;
  active: boolean;
  year_founded?: string;
  contacts?: {
    email?: string;
    phone?: string;
    address?: string;
    social?: {
      twitter?: string;
      telegram?: string;
    };
  };
  social_media_profiles?: string[];
  entity_tags?: string[];
  associated_countries?: string[];
  dead?: boolean;
}

// Entity information
interface EntityData {
  id: string;
  name?: string;
  type: string;
  tags: string[];
  countries: string[];
  metadata: EntityMetadata;
}

// Risk factor collections
interface RiskFactorCollection<T extends RiskFactor> {
  factors: T[];
  aggregateScore: number;
}

// Alternative record-based collection
interface RiskFactorRecord<T extends RiskFactor> {
  byId: Record<string, T>;
  aggregateScore: number;
}

// Main risk scoring response
interface RiskScoringResponse {
  // You can choose either array-based or record-based collections
  entityRisk: RiskFactorCollection<EntityRiskFactor>;
  jurisdictionRisk: RiskFactorCollection<JurisdictionRiskFactor>;
  transactionRisk: RiskFactorCollection<TransactionRiskFactor>;

  // Alternative record-based structure:
  // entityRisk: RiskFactorRecord<EntityRiskFactor>;
  // jurisdictionRisk: RiskFactorRecord<JurisdictionRiskFactor>;
  // transactionRisk: RiskFactorRecord<TransactionRiskFactor>;

  overallRisk: number;
  analysisType: 'address' | 'transaction';
  historicalData: RiskDataPoint[];
  sot?: SOTV2;
}

// Configuration for risk scoring
interface RiskScoringConfig {
  weights: {
    jurisdiction: number;
    entity: number;
    transaction: number;
  };
  maxHops: number;
  hopWeightDecay: number;
}

// Entity information from data source
interface EntityInfo {
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
  no_kyc_req?: boolean;
  centralized?: boolean;
  dead?: boolean;
}

// Transaction information
interface TransactionInfo {
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

export type {
  RiskFactor,
  EntityRiskFactor,
  JurisdictionRiskFactor,
  TransactionRiskFactor,
  RiskFactorCollection,
  RiskFactorRecord,
  RiskDataPoint,
  EntityMetadata,
  EntityData,
  RiskScoringResponse,
  RiskScoringConfig,
  EntityInfo,
  TransactionInfo
}; 