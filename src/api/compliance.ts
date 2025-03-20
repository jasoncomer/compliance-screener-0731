import { axiosInstance } from './api';
import {
  MonitoredAddress,
  AddressUploadFormat,
  AddressUploadResponse,
  MonitoredAddressChange,
  ComplianceTransaction,
} from '../typings/compliance';

// API endpoints
export const compliance = {
  // Get all monitored addresses
  getAddresses: async (): Promise<MonitoredAddress[]> => {
    const endpoint = '/compliance/monitored-addresses';
    const response = await axiosInstance.get(endpoint);
    return response.data.data;
  },

  // Add a new address
  addAddress: async (
    address: Omit<MonitoredAddress, 'id' | 'createdAt' | 'updatedAt' | 'lastModifiedAt' | 'lastModifiedBy'>, 
    organizationId?: string
  ): Promise<MonitoredAddress> => {
    const endpoint = organizationId 
      ? `/compliance/organizations/${organizationId}/monitored-addresses` 
      : '/compliance/monitored-addresses';
    
    const response = await axiosInstance.post(endpoint, address);
    return response.data.data;
  },

  // Update an existing address
  updateAddress: async (
    id: string,
    statusChangeReason: string,
    updateData: Partial<MonitoredAddress>
  ): Promise<MonitoredAddress> => {
    const endpoint = `/compliance/monitored-addresses/${id}`;
    const response = await axiosInstance.put(endpoint, { statusChangeReason, updateData });
    return response.data.data;
  },

  // Delete an address
  deleteAddress: async (id: string): Promise<boolean> => {
    const endpoint = `/compliance/monitored-addresses/${id}`;
    const { data } = await axiosInstance.delete(endpoint);
    return data.deleted;
  },

  // Bulk upload addresses
  bulkUpload: async (
    addresses: AddressUploadFormat[], 
  ): Promise<AddressUploadResponse> => {
    const endpoint = `/compliance/monitored-addresses/bulk`;
    const response = await axiosInstance.post(endpoint, { addresses });
    return response.data.data;
  },

  // Get addresses by filter
  getFilteredAddresses: async (
    filters: {
      blockchain?: string;
      entityName?: string;
      tags?: string[];
      isActive?: boolean;
    },
  ): Promise<MonitoredAddress[]> => {
    const endpoint = `/compliance/monitored-addresses/filter`;
    const response = await axiosInstance.get(endpoint, { params: filters });
    return response.data.data;
  },

  // Get compliance transactions
  getTransactions: async (
    filters: {
      status?: string;
      blockchain?: string;
      timestamp?: { from?: string; to?: string };
      page?: number;
      limit?: number;
    },
  ): Promise<{
    transactions: ComplianceTransaction[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const endpoint = `/compliance/transactions`;
    const response = await axiosInstance.get(endpoint, { params: filters });
    return response.data.data;
  },

  // Update transaction status
  updateTransactionStatus: async (
    transactionId: string, 
    status: string,
  ) => {
    const endpoint = `/compliance/transactions/${transactionId}/status`;
    const response = await axiosInstance.put(endpoint, { status });
    return response.data.data;
  },

  // Get address change history
  getAddressChangeHistory: async (
    addressId: string,
  ): Promise<MonitoredAddressChange[]> => {
    const endpoint = `/compliance/monitored-addresses/${addressId}/history`;
    const response = await axiosInstance.get(endpoint);
    return response.data.data;
  }
};