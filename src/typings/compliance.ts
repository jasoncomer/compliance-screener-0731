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

// Transaction Types
export interface TransactionRecord {
  _id: string;
  monitoredAddressId: string;
  counterpartyAddress: string;
  counterpartyEntity: string;
  blockchain: string;
  amount: number;
  timestamp: string;
  riskScore: number;
  status: string;
  reviewer?: string;
  reviewTimestamp?: string;
}

export interface ComplianceTransaction {
  _id: string;
  transactionId: string;
  monitoredAddressId: {
    _id: string;
    address: string;
    blockchain: string;
    clientId: string;
    notes?: string;
  };
  counterpartyAddress: string;
  blockchain: string;
  amount: number;
  timestamp: string;
  riskScore: number;
  status: string;
  createdBy: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  reviewer?: string;
  reviewTimestamp?: string;
  __v?: number;
}

export interface TransactionFilters {
  status?: string;
  blockchain?: string;
  timestamp?: { from?: string; to?: string };
  page?: number;
  limit?: number;
}

export interface ComplianceTransactionResponse {
  transactions: ComplianceTransaction[];
  total: number;
  page: number;
  limit: number;
}

export const mapComplianceTransactionToRecord = (
  transaction: ComplianceTransaction
): TransactionRecord => {
  return {
    _id: transaction._id,
    monitoredAddressId: transaction.monitoredAddressId._id,
    counterpartyAddress: transaction.counterpartyAddress,
    counterpartyEntity: transaction.monitoredAddressId.address,
    blockchain: transaction.blockchain,
    amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount,
    timestamp: transaction.timestamp,
    riskScore: transaction.riskScore,
    status: transaction.status,
    reviewer: transaction.reviewer,
    reviewTimestamp: transaction.reviewTimestamp
  };
}; 