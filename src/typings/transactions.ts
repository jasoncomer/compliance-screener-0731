// Re-export types from the compliance.ts file
import {
  TransactionRecord,
  IComplianceTransaction,
  ComplianceTransactionResponse,
  mapComplianceTransactionToRecord
} from './compliance';

export type { TransactionRecord, IComplianceTransaction as ComplianceTransaction, ComplianceTransactionResponse };
export { mapComplianceTransactionToRecord }; 