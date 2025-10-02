import { api } from './api';
import { ISARReport, SARReportFilters, SARReportStats, SARReportGenerationRequest } from '../typings/sarReport';

export const sarReportApi = {
  /**
   * Generate a new SAR report
   */
  generateSARReport: async (data: SARReportGenerationRequest): Promise<ISARReport> => {
    const response = await api.post('/sar-reports', data);
    return response.data.data;
  },

  /**
   * Generate comprehensive JSON report with all transaction details
   */
  generateComprehensiveJSONReport: async (data: {
    transactionIds: string[];
    organizationId: string;
    additionalData?: any;
  }): Promise<any> => {
    const response = await api.post('/sar-reports/comprehensive', data);
    return response.data.data;
  },

  /**
   * Get SAR report by ID
   */
  getSARReportById: async (reportId: string): Promise<ISARReport> => {
    const response = await api.get(`/sar-reports/${reportId}`);
    return response.data.data;
  },

  /**
   * Get all SAR reports for an organization
   */
  getSARReports: async (filters?: SARReportFilters): Promise<{ reports: ISARReport[]; total: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/sar-reports?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Update SAR report status
   */
  updateSARReportStatus: async (
    reportId: string, 
    status: 'draft' | 'submitted' | 'accepted' | 'rejected',
    fincenReferenceNumber?: string
  ): Promise<ISARReport> => {
    const response = await api.put(`/sar-reports/${reportId}/status`, {
      status,
      fincenReferenceNumber
    });
    return response.data.data;
  },

  /**
   * Generate FinCEN-compliant XML for SAR submission
   */
  generateFinCENXML: async (reportId: string): Promise<Blob> => {
    const response = await api.get(`/sar-reports/${reportId}/xml`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Generate PDF report for SAR
   */
  generateSARPDF: async (reportId: string): Promise<Blob> => {
    const response = await api.get(`/sar-reports/${reportId}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Delete SAR report (soft delete)
   */
  deleteSARReport: async (reportId: string): Promise<void> => {
    await api.delete(`/sar-reports/${reportId}`);
  },

  /**
   * Get SAR report statistics for dashboard
   */
  getSARReportStats: async (): Promise<SARReportStats> => {
    const response = await api.get('/sar-reports/stats');
    return response.data.data;
  }
};