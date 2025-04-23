/**
 * Compliance-related type definitions
 */
export interface MonitoredAddress {
  _id: string;
  address: string;
  blockchain: string;
  clientId: string;
  notes?: string;
  organizationId?: string;
}

export type AddressUploadFormat = Omit<MonitoredAddress, 'organizationId' | '_id'>;

export interface AddressUploadResponse {
  successful: AddressUploadFormat[];
  failed: {
    entry: AddressUploadFormat;
    reason: string;
  }[];
}

export type AddressImportFormat = 'csv' | 'json';

export interface AddressFilters {
  blockchain?: string;
  entityName?: string;
  tags?: string[];
  isActive?: boolean;
}

// Monitored Address Change History Types
export type MonitoredAddressChangeType = 'create' | 'update' | 'delete' | 'status_change';

export interface MonitoredAddressChange {
  _id: string;
  monitoredAddressId: string;
  changeType: 'create' | 'update' | 'delete' | 'status_change';
  fieldName?: string;
  oldValue?: string | number | boolean | string[] | number | undefined;
  newValue?: string | number | boolean | string[] | number | undefined;
  notes?: string;
  changedById: string;
  organizationId?: string;
  timestamp: string;
}

export enum ETransactionStatus {
  UNASSIGNED = 'UNASSIGNED', // Default. Transition to UNREVIEWED when assigned to compliance member
  UNREVIEWED = 'UNREVIEWED', // Transition to APPROVED

  IN_REVIEW = 'IN_REVIEW', // Reviewed by compliance team

  APPROVED = 'APPROVED', // Approved by compliance team
  HOLD = 'HOLD', // Hold by compliance team

  CLOSED_WITH_NOTE = 'CLOSED_WITH_NOTE', // Closed with note
  CLOSED_WITH_SAR = 'CLOSED_WITH_SAR', // Closed with SAR report
}

export type TTransactionStatus = keyof typeof ETransactionStatus;

export interface IComplianceTransaction {
  _id: string;
  txId: string;
  approvedBy?: string;
  approvedAt?: Date;

  clientId: string;
  monitoredAddressId: string;
  counterpartyEntities: string[];
  blockchain: string;
  amount: number;
  timestamp: Date;
  riskScores: number[];
  organizationId: string;
  notes?: string;

  // Question: status vs new field for SAR reports?
  sarSubmitted: boolean;
  sarReport?: string | null;

  reviewerId?: string;
  reviewTimestamp?: Date;
  status: ETransactionStatus;
  statusHistory: {
    status: ETransactionStatus;
    timestamp: Date;
    reviewer?: string;
  }[];
}

export interface TransactionFilters {
  status?: string;
  statusExclude?: string; // Comma-separated list of statuses to exclude
  blockchain?: string;
  clientId?: string;
  timestamp?: { from?: string; to?: string };
  minAmount?: number;
  maxAmount?: number;
  riskLevel?: 'high' | 'medium' | 'low';
  page?: number;
  limit?: number;
}

export interface ComplianceTransactionResponse {
  transactions: IComplianceTransaction[];
  total: number;
  page: number;
  limit: number;
}
