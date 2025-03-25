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
  UNREVIEWED = 'UNREVIEWED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  APPROVED = 'APPROVED',
  IN_REVIEW = 'IN_REVIEW',
  CLOSED = 'CLOSED'
}

export type TTransactionStatus = keyof typeof ETransactionStatus;
export interface IComplianceTransaction {
  _id: string;
  txId: string;
  monitoredAddressId: string;
  counterpartyEntities: string[];
  blockchain: string;
  amount: number;
  timestamp: Date;
  riskScores: number[];
  status: ETransactionStatus;
  reviewer?: string;
  reviewTimestamp?: Date;
  notes?: string;
  organizationId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionFilters {
  status?: string;
  blockchain?: string;
  timestamp?: { from?: string; to?: string };
  page?: number;
  limit?: number;
}

export interface ComplianceTransactionResponse {
  transactions: IComplianceTransaction[];
  total: number;
  page: number;
  limit: number;
}
