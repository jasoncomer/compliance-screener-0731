import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Trash2, Calendar, User, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { sarReportApi } from '../api/sarReport';
import { ISARReport, SARReportStats } from '../typings/sarReport';

interface SARReportListProps {
  onViewReport?: (report: ISARReport) => void;
  onGenerateNew?: () => void;
}

export const SARReportList: React.FC<SARReportListProps> = ({
  onViewReport,
  onGenerateNew
}) => {
  const [reports, setReports] = useState<ISARReport[]>([]);
  const [stats, setStats] = useState<SARReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [selectedReport, setSelectedReport] = useState<ISARReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadReports();
    loadStats();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const result = await sarReportApi.getSARReports({
        status: filters.status || undefined,
        limit: 50
      });
      setReports(result.reports);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load SAR reports');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await sarReportApi.getSARReportStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load SAR report stats:', err);
    }
  };

  const handleViewReport = (report: ISARReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
    onViewReport?.(report);
  };

  const handleDownloadXML = async (report: ISARReport) => {
    try {
      const blob = await sarReportApi.generateFinCENXML(report._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sar-report-${report.reportMetadata.reportId}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download XML file');
    }
  };

  const handleDownloadPDF = async (report: ISARReport) => {
    try {
      const blob = await sarReportApi.generateSARPDF(report._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sar-report-${report.reportMetadata.reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF file');
    }
  };

  const handleDeleteReport = async (report: ISARReport) => {
    if (!window.confirm('Are you sure you want to delete this SAR report?')) {
      return;
    }

    try {
      await sarReportApi.deleteSARReport(report._id);
      loadReports();
      loadStats();
    } catch (err) {
      setError('Failed to delete SAR report');
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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredReports = reports.filter(report => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        report.reportMetadata.reportId.toLowerCase().includes(searchTerm) ||
        report.subject.name.toLowerCase().includes(searchTerm) ||
        report.suspiciousActivity.activityType.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading SAR reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SAR Reports</h2>
          <p className="text-gray-600">Manage Suspicious Activity Reports</p>
        </div>
        <Button 
          onClick={onGenerateNew}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate New Report
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 font-bold text-sm">D</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Draft</p>
                  <p className="text-2xl font-bold">{stats.byStatus.draft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">S</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-2xl font-bold">{stats.byStatus.submitted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">A</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-2xl font-bold">{stats.byStatus.accepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>SAR Reports ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Activity Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report._id}>
                  <TableCell className="font-medium">
                    {report.reportMetadata.reportId}
                  </TableCell>
                  <TableCell>{report.subject.name}</TableCell>
                  <TableCell>{report.suspiciousActivity.activityType}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(report.reportMetadata.status)}>
                      {report.reportMetadata.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {report.suspiciousActivity.amount.value} {report.suspiciousActivity.amount.currency}
                    {report.suspiciousActivity.amount.usdValue && 
                      ` ($${report.suspiciousActivity.amount.usdValue.toLocaleString()})`
                    }
                  </TableCell>
                  <TableCell>{formatDate(report.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReport(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadXML(report)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(report)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReport(report)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SAR Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              {/* Report Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Report ID</Label>
                      <p className="text-sm text-gray-600">{selectedReport.reportMetadata.reportId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedReport.reportMetadata.status)}>
                          {selectedReport.reportMetadata.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Subject</Label>
                      <p className="text-sm text-gray-600">{selectedReport.subject.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Activity Type</Label>
                      <p className="text-sm text-gray-600">{selectedReport.suspiciousActivity.activityType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Amount</Label>
                      <p className="text-sm text-gray-600">
                        {selectedReport.suspiciousActivity.amount.value} {selectedReport.suspiciousActivity.amount.currency}
                        {selectedReport.suspiciousActivity.amount.usdValue && 
                          ` ($${selectedReport.suspiciousActivity.amount.usdValue.toLocaleString()})`
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Transactions</Label>
                      <p className="text-sm text-gray-600">{selectedReport.relatedTransactions.length} transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Narrative */}
              <Card>
                <CardHeader>
                  <CardTitle>Narrative</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Summary</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.narrative.summary}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Detailed Description</Label>
                      <p className="text-sm text-gray-600 mt-1">{selectedReport.narrative.detailedDescription}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReportModal(false)}>
                  Close
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadXML(selectedReport)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download XML
                </Button>
                <Button 
                  onClick={() => handleDownloadPDF(selectedReport)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};