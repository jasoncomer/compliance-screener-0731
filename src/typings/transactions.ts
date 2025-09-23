// Re-export types from the compliance.ts file
import {
  ComplianceTransactionResponse,
  IComplianceTransaction,
} from './compliance';

export type { IComplianceTransaction as ComplianceTransaction, ComplianceTransactionResponse };
