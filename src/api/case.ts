import {
  ICase,
  ClientOverview,
  CaseFilters,
  CreateCaseRequest,
  UpdateCaseStatusRequest,
  CaseListResponse,
  ClientOverviewResponse
} from '../typings/case';
import { axiosInstance } from './api';

// API endpoints for case management
export const caseApi = {
  // Create a case from a compliance transaction
  createCaseFromTransaction: async (
    transactionId: string,
    caseData: CreateCaseRequest
  ): Promise<ICase> => {
    const endpoint = `/cases/transactions/${transactionId}/case`;
    const response = await axiosInstance.post(endpoint, caseData);
    return response.data.data;
  },

  // Get all cases with optional filters
  getCases: async (filters?: CaseFilters): Promise<CaseListResponse> => {
    const endpoint = '/cases';
    const response = await axiosInstance.get(endpoint, { params: filters });
    return response.data.data;
  },

  // Get a specific case by ID
  getCaseById: async (caseId: string): Promise<ICase> => {
    const endpoint = `/cases/${caseId}`;
    const response = await axiosInstance.get(endpoint);
    return response.data.data;
  },

  // Update case status
  updateCaseStatus: async (
    caseId: string,
    statusData: UpdateCaseStatusRequest
  ): Promise<ICase> => {
    const endpoint = `/cases/${caseId}/status`;
    const response = await axiosInstance.patch(endpoint, statusData);
    return response.data.data;
  },

  // Get client overview with metrics
  getClientOverview: async (
    clientId: string,
    timeRange?: string,
    refresh?: boolean
  ): Promise<ClientOverviewResponse> => {
    const endpoint = `/cases/clients/${clientId}/overview`;
    const response = await axiosInstance.get(endpoint, { 
      params: { timeRange, refresh } 
    });
    return response.data.data;
  },

  // Process transactions for a specific client
  processClientTransactions: async (clientId: string): Promise<{ processedAddresses: number; totalAddresses: number }> => {
    const endpoint = `/cases/clients/${clientId}/process-transactions`;
    const response = await axiosInstance.post(endpoint);
    return response.data.data;
  }
};