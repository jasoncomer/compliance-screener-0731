import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { caseReportApi, CaseReportResponse } from '../api/caseReport';
import { storage } from '../utils/storage';

interface CaseReportSectionProps {
  caseId: string;
  transactionId: string;
  organizationId: string;
}

export const CaseReportSection: React.FC<CaseReportSectionProps> = ({
  caseId,
  transactionId,
  organizationId
}) => {
  const [reports, setReports] = useState<CaseReportResponse[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<CaseReportResponse | null>(null);

  // Load existing reports
  useEffect(() => {
    loadReports();
  }, [caseId, organizationId]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Debug authentication status
      const authData = storage.getAllAuthData();
      console.log('🔐 Loading Reports - Auth Status:', {
        hasAccessToken: !!authData.accessToken,
        hasRefreshToken: !!authData.refreshToken,
        hasUser: !!authData.user,
        organizationId,
        caseId
      });
      
      const reportsData = await caseReportApi.getCaseReports(caseId, organizationId);
      setReports(reportsData);
      
      // Set the most recent completed report as selected
      const completedReport = reportsData.find(r => r.status === 'completed');
      if (completedReport) {
        setSelectedReport(completedReport);
      }
    } catch (err: any) {
      console.error('❌ Load Reports Error:', err);
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Debug authentication status
      const authData = storage.getAllAuthData();
      console.log('🔐 Auth Status:', {
        hasAccessToken: !!authData.accessToken,
        hasRefreshToken: !!authData.refreshToken,
        hasUser: !!authData.user,
        organizationId,
        caseId,
        transactionId
      });
      
      const newReport = await caseReportApi.generateCaseReport({
        caseId,
        transactionId,
        organizationId,
        reportType: 'address_analysis'
      });
      
      setReports(prev => [newReport, ...prev]);
      setSelectedReport(newReport);
      
      // Poll for completion if status is generating
      if (newReport.status === 'generating') {
        pollReportStatus(newReport._id);
      }
    } catch (err: any) {
      console.error('❌ Case Report Generation Error:', err);
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const pollReportStatus = async (reportId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;
    
    const poll = async () => {
      try {
        const report = await caseReportApi.getCaseReportById(reportId, organizationId);
        
        setReports(prev => 
          prev.map(r => r._id === reportId ? report : r)
        );
        
        if (report.status === 'completed') {
          setSelectedReport(report);
          return;
        }
        
        if (report.status === 'failed') {
          setError('Report generation failed');
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setError('Report generation timed out');
        }
      } catch (err) {
        setError('Failed to check report status');
      }
    };
    
    poll();
  };

  const handleDownloadPDF = async (report: CaseReportResponse) => {
    try {
      const blob = await caseReportApi.downloadCaseReportPDF(report._id, organizationId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `case-report-${report.reportData.reportMetadata.reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to download PDF');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generating':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-gray-500">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                Generate Case Report
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a comprehensive compliance report for this transaction
              </p>
            </div>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Report Status */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
            Report Status
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            {reports.length === 0 ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  No report generated yet
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {getStatusIcon(selectedReport?.status || reports[0]?.status || '')}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedReport?.status === 'completed' 
                    ? 'Report completed successfully' 
                    : reports[0]?.status === 'generating'
                    ? 'Report generation in progress...'
                    : 'Report status unknown'
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Report History */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
            Report History
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No previous reports available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReport?._id === report._id
                        ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(report.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Report {report.reportData.reportMetadata.reportId}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(report.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(report.status)}>
                          {report.status.toUpperCase()}
                        </Badge>
                        {report.status === 'completed' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(report);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const viewUrl = await caseReportApi.getCaseReportViewUrl(report._id, organizationId);
                                  window.open(viewUrl, '_blank');
                                } catch (error) {
                                  console.error('Error getting view URL:', error);
                                  // Fallback to direct URL
                                  window.open(
                                    caseReportApi.getCaseReportPDFUrl(report._id, organizationId),
                                    '_blank'
                                  );
                                }
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report Preview */}
        {selectedReport && selectedReport.status === 'completed' && (
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
              Report Preview
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="aspect-video bg-white dark:bg-gray-800 rounded border flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    PDF report generated successfully
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPDF(selectedReport)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const viewUrl = await caseReportApi.getCaseReportViewUrl(selectedReport._id, organizationId);
                          window.open(viewUrl, '_blank');
                        } catch (error) {
                          console.error('Error getting view URL:', error);
                          // Fallback to direct URL
                          window.open(
                            caseReportApi.getCaseReportPDFUrl(selectedReport._id, organizationId),
                            '_blank'
                          );
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};