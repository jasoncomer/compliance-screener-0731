import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { sarReportApi } from '../../api/sarReport';
import { IComplianceTransaction } from '../../typings/compliance';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: IComplianceTransaction[];
  onReportGenerated?: (report: any) => void;
}

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onReportGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [customData, setCustomData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setGeneratedReport(null);
      setCustomData({});
      setError(null);
    }
  }, [isOpen]);

  const handleGenerateReport = async () => {
    if (transactions.length === 0) {
      setError('No transactions selected for report generation');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const transactionIds = transactions.map(tx => tx._id);
      const report = await sarReportApi.generateComprehensiveJSONReport({
        transactionIds,
        organizationId: transactions[0]?.organizationId || '',
        additionalData: customData
      });

      setGeneratedReport(report);
      onReportGenerated?.(report);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!generatedReport) return;

    try {
      // Download the comprehensive JSON report
      const blob = new Blob([JSON.stringify(generatedReport, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transaction-report-${generatedReport.reportMetadata.reportId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download report');
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Transaction Report
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!generatedReport ? (
          <div className="space-y-6">
            {/* Transaction Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {transactions.length} transaction(s) selected for report generation
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {transactions.slice(0, 4).map((tx) => (
                      <div key={tx._id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">{tx.txId.substring(0, 16)}...</div>
                        <div className="text-gray-600">{tx.amount} {tx.blockchain}</div>
                      </div>
                    ))}
                    {transactions.length > 4 && (
                      <div className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                        +{transactions.length - 4} more transactions
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Data Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custom Report Data (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subjectName">Subject Name</Label>
                    <Input
                      id="subjectName"
                      value={customData.subject?.name || ''}
                      onChange={(e) => setCustomData((prev: any) => ({
                        ...prev,
                        subject: {
                          ...prev.subject,
                          name: e.target.value
                        }
                      }))}
                      placeholder="Enter subject name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="activityType">Activity Type</Label>
                    <Select
                      value={customData.suspiciousActivity?.activityType || ''}
                      onValueChange={(value) => setCustomData((prev: any) => ({
                        ...prev,
                suspiciousActivity: {
                          ...prev.suspiciousActivity,
                          activityType: value
                        }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="structuring">Structuring</SelectItem>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="fraud">Fraud</SelectItem>
                        <SelectItem value="mixing">Mixing</SelectItem>
                        <SelectItem value="darknet">Darknet Activity</SelectItem>
                        <SelectItem value="high-risk">High-Risk Activity</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="narrative">Additional Narrative</Label>
                  <Textarea
                    id="narrative"
                    value={customData.narrative?.detailedDescription || ''}
                    onChange={(e) => setCustomData((prev: any) => ({
                      ...prev,
                      narrative: {
                        ...prev.narrative,
                        detailedDescription: e.target.value
                      }
                    }))}
                    placeholder="Enter additional narrative details..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Generate Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateReport} 
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Transaction report generated successfully! Report ID: {generatedReport.reportMetadata.reportId}
              </AlertDescription>
            </Alert>

            {/* Report Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Report ID</Label>
                    <p className="text-sm text-gray-600">{generatedReport.reportMetadata.reportId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(generatedReport.reportMetadata.status)}>
                        {generatedReport.reportMetadata.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Subject</Label>
                    <p className="text-sm text-gray-600">{generatedReport.subject.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Activity Type</Label>
                    <p className="text-sm text-gray-600">{generatedReport.suspiciousActivity.activityType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p className="text-sm text-gray-600">
                      {generatedReport.suspiciousActivity.amount.value} {generatedReport.suspiciousActivity.amount.currency}
                      {generatedReport.suspiciousActivity.amount.usdValue && 
                        ` ($${generatedReport.suspiciousActivity.amount.usdValue.toLocaleString()})`
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Transactions</Label>
                    <p className="text-sm text-gray-600">{generatedReport.relatedTransactions.length} transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={handleDownloadReport}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};