export enum ECaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  UNREVIEWED = 'UNREVIEWED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export enum ECasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface CaseEvidence {
  type: string;
  source: string;
  addedAt: string;
  addedBy: {
    _id: string;
    name: string;
    email: string;
  };
  metadata?: Record<string, any>;
}

export interface CaseStatusHistory {
  status: ECaseStatus;
  timestamp: string;
  changedBy: {
    _id: string;
    name: string;
    email: string;
  };
  notes?: string;
}

export interface ICase {
  _id: string;
  caseNumber: string;
  title: string;
  description?: string;
  
  // Links to compliance transaction
  complianceTransactionId: {
    _id: string;
    txId: string;
    amount: number;
    timestamp: string;
    blockchain: string;
  };
  clientId: string;
  
  // Case management
  status: ECaseStatus;
  priority: ECasePriority;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  assignedAt?: string;
  
  // Organization context
  organizationId: string;
  
  // Case details
  notes?: string;
  tags?: string[];
  
  // Timestamps
  openedAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Status history for audit trail
  statusHistory: CaseStatusHistory[];
  
  // Evidence and attachments
  evidence: CaseEvidence[];
  
  // Metrics
  totalAmount?: number;
  riskScore?: number;
  
  // Additional properties for transaction cases
  isTransactionCase?: boolean;
  txId?: string;
  transactionId?: string;
}

export interface ClientOverview {
  _id: string;
  clientId: string;
  organizationId: string;
  
  // Basic client info
  clientName?: string;
  clientType?: string;
  
  // Transaction metrics
  totalTransactions: number;
  totalInflow: number;
  totalOutflow: number;
  averageTransactionSize: number;
  largestTransaction: number;
  
  // Case metrics
  totalCases: number;
  openCases: number;
  closedCases: number;
  highPriorityCases: number;
  
  // Risk metrics
  averageRiskScore: number;
  highestRiskScore: number;
  riskTrend: 'increasing' | 'decreasing' | 'stable';
  
  // Time-based metrics
  firstTransactionDate?: string;
  lastTransactionDate?: string;
  lastCaseDate?: string;
  
  // Activity periods
  dailyActivity: {
    date: string;
    transactionCount: number;
    totalAmount: number;
    caseCount: number;
  }[];
  
  // Monthly aggregations
  monthlyMetrics: {
    year: number;
    month: number;
    transactionCount: number;
    totalAmount: number;
    averageAmount: number;
    caseCount: number;
    averageRiskScore: number;
  }[];
  
  // Last updated
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseFilters {
  status?: ECaseStatus;
  priority?: ECasePriority;
  assignedTo?: string;
  clientId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCaseRequest {
  title: string;
  description?: string;
  priority?: ECasePriority;
  notes?: string;
}

export interface UpdateCaseStatusRequest {
  status: ECaseStatus;
  notes?: string;
}

export interface CaseListResponse {
  cases: ICase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientOverviewResponse {
  overview: ClientOverview;
  cases: ICase[];
  transactions?: any[]; // Add transactions to the response interface
  topCounterparties?: Array<{
    entityId: string;
    count: number;
    totalAmount: number;
    lastTransactionDate: string;
  }>;
}