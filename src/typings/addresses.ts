// Re-export types from the compliance.ts file
import {
  MonitoredAddress,
  AddressUploadFormat,
  AddressUploadResponse,
  AddressImportFormat,
  IAddressFilters,
  IComplianceTransaction,
  TransactionFilters,
  MonitoredAddressChangeType,
  MonitoredAddressChange
} from './compliance';

export type {
  MonitoredAddress,
  AddressUploadFormat,
  AddressUploadResponse,
  AddressImportFormat,
  IAddressFilters as AddressFilters,
  IComplianceTransaction as ComplianceTransaction,
  TransactionFilters,
  MonitoredAddressChangeType,
  MonitoredAddressChange
}; 