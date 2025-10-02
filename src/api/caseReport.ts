import { axiosInstance } from './api';

export interface CaseReportGenerationRequest {
  caseId: string;
  transactionId: string;
  organizationId: string;
  reportType?: 'address_analysis' | 'transaction_analysis' | 'compliance_report';
}

export interface CaseReportResponse {
  _id: string;
  caseId: string;
  transactionId: string;
  status: 'generating' | 'completed' | 'failed';
  reportData: {
    addresses: string[];
    primaryAddress: string;
    transactionHash: string;
    reportMetadata: {
      generatedAt: string;
      reportId: string;
      version: string;
    };
    addressAnalysis: {
      [address: string]: {
        balance: number;
        totalReceived: number;
        totalSent: number;
        transactionCount: number;
        riskScore?: number;
        riskFactors?: any[];
      };
    };
    transactionDetails: {
      hash: string;
      amount: number;
      fees: number;
      confirmations: number;
      timestamp: string;
      inputs: any[];
      outputs: any[];
    };
    pdfUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const caseReportApi = {
  /**
   * Generate a new case report
   */
  generateCaseReport: async (data: CaseReportGenerationRequest): Promise<CaseReportResponse> => {
    const response = await axiosInstance.post('/case-reports', data);
    return response.data.data;
  },

  /**
   * Get all case reports for a specific case
   */
  getCaseReports: async (caseId: string, organizationId: string): Promise<CaseReportResponse[]> => {
    const response = await axiosInstance.get(`/case-reports/case/${caseId}?organizationId=${organizationId}`);
    return response.data.data;
  },

  /**
   * Get a specific case report by ID
   */
  getCaseReportById: async (reportId: string, organizationId: string): Promise<CaseReportResponse> => {
    const response = await axiosInstance.get(`/case-reports/${reportId}?organizationId=${organizationId}`);
    return response.data.data;
  },

  /**
   * Download case report PDF
   */
  downloadCaseReportPDF: async (reportId: string, organizationId: string): Promise<Blob> => {
    const response = await axiosInstance.get(`/case-reports/${reportId}/download?organizationId=${organizationId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Get case report PDF URL for viewing
   */
  getCaseReportPDFUrl: (reportId: string, organizationId: string): string => {
    return `${axiosInstance.defaults.baseURL}/case-reports/${reportId}/view?organizationId=${organizationId}`;
  },

  /**
   * Get a view URL for the case report PDF
   */
  getCaseReportViewUrl: async (reportId: string, organizationId: string): Promise<string> => {
    const response = await axiosInstance.get(`/case-reports/${reportId}/view-url?organizationId=${organizationId}`);
    return response.data.data.viewUrl;
  }
};