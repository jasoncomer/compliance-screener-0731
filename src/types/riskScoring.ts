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
    riskComponents: {
        jurisdictionRiskDetails: {
            countries: string[];
            individualScores: number[];
            adjustedScore: number;
        };
        entityRiskDetails: {
            mainTypeScore: number;
            tagScores: Array<{ tag: string; score: number }>;
            adjustedScore: number;
            riskModifiers: Array<{ type: string; impact: number | 'Maximum' }>;
            noKycPenalty?: number;
        };
        transactionRiskDetails: TransactionRiskFactors;
    };
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
    riskFactors: TransactionRiskFactors;
}

export interface TransactionRiskFactors {
    amount: RiskFactor;
    sender: RiskFactor;
    receiver: RiskFactor;
    pattern: RiskFactor;
    timing: RiskFactor;
    hops: Array<{
        txHash: string;
        riskScore: number;
        hopLevel: number;
        weight: number;
        weightedRisk: number;
    }>;
}

export interface RiskFactor {
    score: number;
    severity: 'high' | 'medium' | 'low';
    description: string;
    details?: string[];
}

export interface RiskScoringRequest {
    identifier: string;
    type: 'address' | 'transaction';
} 