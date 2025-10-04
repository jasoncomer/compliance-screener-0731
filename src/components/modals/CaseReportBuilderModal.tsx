import React, { useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { IComplianceTransaction } from '@/typings/compliance';

export interface ReportModuleData {
  id: string;
  type: 'text' | 'chart' | 'image';
  content: any;
}

interface CaseReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: IComplianceTransaction | null;
  onReportGenerated?: (report: any) => void;
}

export const CaseReportBuilderModal: React.FC<CaseReportBuilderModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onReportGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);


  const handleGenerateReport = async () => {
    if (!transaction) return;

    setIsGenerating(true);
    setError(null);

    try {
      const reportData = {
        transaction,
        metadata: {
          reportId: `CR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          generatedAt: new Date().toISOString(),
          generatedBy: 'Compliance Screener'
        }
      };

      setGeneratedReport(reportData);
      onReportGenerated?.(reportData);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedReport) return;
    // TODO: Implement actual PDF generation
  };

  const handleViewInNewTab = () => {
    if (!generatedReport) return;
    // TODO: Implement actual preview
  };

  if (!transaction) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Case Report Builder</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Create a comprehensive compliance report for transaction {transaction.txId.slice(0, 8)}...
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          {!generatedReport ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Generation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Generate a comprehensive compliance report for this transaction.
                  </p>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><strong>Transaction ID:</strong> {transaction.txId}</div>
                    <div><strong>Amount:</strong> {(transaction.amount / 100000000).toFixed(8)} BTC</div>
                    <div><strong>Timestamp:</strong> {new Date(transaction.timestamp).toLocaleString()}</div>
                    <div><strong>Status:</strong> {transaction.status || 'PENDING'}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Report generated successfully! Report ID: {generatedReport.metadata.reportId}
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Report Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleViewInNewTab}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View in New Tab
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Report Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Compliance Case Report</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Report ID:</strong> {generatedReport.metadata.reportId}</div>
                      <div><strong>Generated:</strong> {new Date(generatedReport.metadata.generatedAt).toLocaleString()}</div>
                      <div><strong>Transaction ID:</strong> {transaction.txId}</div>
                      <div><strong>Amount:</strong> {(transaction.amount / 100000000).toFixed(8)} BTC</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};