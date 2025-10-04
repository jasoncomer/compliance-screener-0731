import React from 'react';
import { FileText, Download, Eye } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { ReportModuleData } from '../CaseReportBuilderModal';

interface ReportPreviewProps {
  report: any;
  modules: ReportModuleData[];
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ report, modules }) => {
  const renderModulePreview = (module: ReportModuleData) => {
    switch (module.type) {
      case 'transaction-info':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transaction Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Transaction ID:</span>
                <p className="font-mono text-xs break-all">{report.transaction.txId}</p>
              </div>
              <div>
                <span className="font-medium">Amount:</span>
                <p>{(report.transaction.amount / 100000000).toFixed(8)} BTC</p>
              </div>
              <div>
                <span className="font-medium">Timestamp:</span>
                <p>{new Date(report.transaction.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant="secondary">{report.transaction.status || 'PENDING'}</Badge>
              </div>
            </div>
          </div>
        );
      
      case 'transaction-risk':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Risk Analysis</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-2xl font-bold text-green-600">25</div>
                <div className="text-xs text-gray-500">Overall Risk</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-2xl font-bold text-green-600">23</div>
                <div className="text-xs text-gray-500">Entity Risk</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-2xl font-bold text-green-600">15</div>
                <div className="text-xs text-gray-500">Transaction Risk</div>
              </div>
            </div>
          </div>
        );
      
      case 'counterparty-info':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Counterparty Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Entity:</span> Crypto Exchange Ltd
              </div>
              <div>
                <span className="font-medium">Type:</span> Exchange
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <Badge variant="secondary" className="ml-2">Verified</Badge>
              </div>
            </div>
          </div>
        );
      
      case 'notes':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-medium">Initial Review</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Transaction appears to be a standard exchange transfer.
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Image</h3>
            {module.content?.imageUrl ? (
              <div>
                <img 
                  src={module.content.imageUrl} 
                  alt="Report image" 
                  className="max-w-full h-48 object-contain rounded border"
                />
                {module.content.caption && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                    {module.content.caption}
                  </p>
                )}
              </div>
            ) : (
              <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <span className="text-gray-500">No image uploaded</span>
              </div>
            )}
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-4">
            {module.content?.title && (
              <h3 className="text-lg font-semibold">{module.content.title}</h3>
            )}
            {module.content?.text && (
              <div 
                className="text-sm whitespace-pre-wrap"
                style={{ textAlign: module.content.alignment || 'left' }}
              >
                {module.content.text}
              </div>
            )}
          </div>
        );
      
      case 'chart':
        return (
          <div className="space-y-4">
            {module.content?.title && (
              <h3 className="text-lg font-semibold">{module.content.title}</h3>
            )}
            <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded border flex items-center justify-center">
              <span className="text-gray-500">Chart Preview</span>
            </div>
          </div>
        );
      
      default:
        return <div>Unknown module type</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Compliance Case Report</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Report ID: {report.metadata.reportId}
              </p>
              <p className="text-sm text-gray-500">
                Generated: {new Date(report.metadata.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                <FileText className="h-3 w-3 mr-1" />
                Generated
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Report Content */}
      <div className="space-y-6">
        {modules
          .sort((a, b) => a.position - b.position)
          .map((module, index) => (
            <Card key={module.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <h2 className="text-lg font-semibold">{module.title}</h2>
                </div>
                {renderModulePreview(module)}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Report Footer */}
      <Card>
        <CardContent className="p-4 text-center text-sm text-gray-500">
          <p>This report was generated by the Compliance Screener system</p>
          <p>For questions or concerns, please contact the compliance team</p>
        </CardContent>
      </Card>
    </div>
  );
};