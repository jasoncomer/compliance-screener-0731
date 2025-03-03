export interface MonitoredAddress {
  id: string;
  address: string;
  blockchain: string;
  entityName: string;
  riskThreshold?: number;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface AddressUploadFormat {
  address: string;
  blockchain: string;
  entityName: string;
  riskThreshold?: number;
  tags?: string[];
  notes?: string;
}

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