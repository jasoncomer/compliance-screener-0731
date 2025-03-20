// Re-export types from the compliance.ts file
import {
  TransactionRecord,
  ComplianceTransaction,
  ComplianceTransactionResponse,
  mapComplianceTransactionToRecord
} from './compliance';

export type { TransactionRecord, ComplianceTransaction, ComplianceTransactionResponse };
export { mapComplianceTransactionToRecord }; 