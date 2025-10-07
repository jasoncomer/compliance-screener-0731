import {
  AddressUploadFormat,
  AddressUploadResponse,
  IComplianceTransaction,
  MonitoredAddress,
  MonitoredAddressChange,
} from '../typings/compliance';

import { axiosInstance } from './api';

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
      clientId?: string;
      txId?: string;
      assignedTo?: string;
      timestamp?: { from?: string; to?: string };
      minAmount?: number;
      maxAmount?: number;
      minRiskLevel?: number;
      maxRiskLevel?: number;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{
    transactions: IComplianceTransaction[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const endpoint = `/compliance/transactions`;
    const response = await axiosInstance.get(endpoint, { params: filters });
    console.log('API Response for transactions:', {
      filters,
      responseData: response.data,
      transactionsCount: response.data?.data?.transactions?.length || 0,
      firstTransaction: response.data?.data?.transactions?.[0] ? {
        keys: Object.keys(response.data.data.transactions[0]),
        txId: response.data.data.transactions[0].txId,
        _id: response.data.data.transactions[0]._id,
        status: response.data.data.transactions[0].status
      } : null,
      allTxIds: response.data?.data?.transactions?.map((tx: any) => tx.txId) || [],
      allTxIdsFull: response.data?.data?.transactions?.map((tx: any) => ({ txId: tx.txId, clientId: tx.clientId, _id: tx._id, status: tx.status })) || [],
      allStatuses: response.data?.data?.transactions?.map((tx: any) => tx.status) || [],
      searchTerm: filters.txId,
      matches: response.data?.data?.transactions?.filter((tx: any) => 
        tx.txId && tx.txId.includes(filters.txId || '')
      ).length || 0
    });
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

  // Update transaction assignee
  updateTransactionAssignee: async (
    transactionId: string,
    assigneeId: string
  ): Promise<IComplianceTransaction> => {
    const endpoint = `/compliance/transactions/${transactionId}/assignee`;
    const response = await axiosInstance.put(endpoint, { assigneeId });
    return response.data.data;
  },
  
  // Bulk update transaction assignee
  bulkUpdateTransactionAssignee: async (
    transactionIds: string[],
    assigneeId: string
  ): Promise<IComplianceTransaction[]> => {
    const endpoint = `/compliance/transactions/bulk/assignee`;
    const response = await axiosInstance.post(endpoint, { 
      transactionIds,
      assigneeId
    });
    return response.data.data.results;
  },

  // Bulk update transaction status
  bulkUpdateTransactionStatus: async (
    transactionIds: string[],
    status: string
  ): Promise<IComplianceTransaction[]> => {
    const endpoint = `/compliance/transactions/bulk/status`;
    const response = await axiosInstance.post(endpoint, { 
      transactionIds,
      status
    });
    return response.data.data.results;
  },

  // Get address change history
  getAddressChangeHistory: async (
    addressId: string,
  ): Promise<MonitoredAddressChange[]> => {
    const endpoint = `/compliance/monitored-addresses/${addressId}/history`;
    const response = await axiosInstance.get(endpoint);
    return response.data.data;
  },

  // Get unique client IDs
  getUniqueClientIds: async (): Promise<string[]> => {
    const endpoint = `/compliance/client-ids`;
    const response = await axiosInstance.get(endpoint);
    return response.data.data;
  }
};