interface RiskFactor {
    factor: string;
    score: number;
    description: string;
    severity: 'high' | 'medium' | 'low';
}

interface HistoricalData {
    date: string;
    overallRisk: number;
}

interface EntityInfo {
    entity_id: string;
    entity_type: string;
    entity_tags: string[];
    associated_countries: string[];
    kyc_req: boolean;
    centralized: boolean;
    dead: boolean;
}

interface RiskModifier {
    type: string;
    impact: number;
}

interface CategoryRisk {
    tags: string[];
    avgRisk: number;
}

interface EntityRiskDetails {
    mainTypeScore: number;
    tagScores: any[]; // Specify type if available
    categoryRisks: CategoryRisk;
    adjustedScore: number;
    riskModifiers: RiskModifier[];
    noKycPenalty: number;
}

interface JurisdictionRiskDetails {
    countries: string[];
    individualScores: any[]; // Specify type if available
    adjustedScore: number | null;
}

interface TransactionRiskDetail {
    score: number;
    severity: string;
    description: string;
}

interface TransactionRiskDetails {
    amount: TransactionRiskDetail;
    sender: TransactionRiskDetail;
    receiver: TransactionRiskDetail;
    pattern: TransactionRiskDetail;
    timing: TransactionRiskDetail;
    hops: any[]; // Specify type if available
}

interface RiskComponents {
    jurisdictionRiskDetails: JurisdictionRiskDetails;
    entityRiskDetails: EntityRiskDetails;
    transactionRiskDetails: TransactionRiskDetails;
}

export interface RiskScores {
    transactionRisk: number;
    entityRisk: number;
    jurisdictionRisk: number | null;
    overallRisk: number | null;
    details: {
        transaction: RiskFactor[];
        entity: RiskFactor[];
        jurisdiction: RiskFactor[];
    };
    historicalData: HistoricalData[];
    entityInfo: EntityInfo;
    analysisType: string;
    riskComponents: RiskComponents;
}
