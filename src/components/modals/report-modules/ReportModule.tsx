import React from 'react';
import { GripVertical, X, ChevronUp, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { IComplianceTransaction } from '@/typings/compliance';
import { ReportModuleData } from '../CaseReportBuilderModal';
import { TransactionInfoSummary } from './TransactionInfoSummary';
import { TransactionRiskSummary } from './TransactionRiskSummary';
import { CounterpartyInfoSummary } from './CounterpartyInfoSummary';
import { NotesSummary } from './NotesSummary';
import { ImageModule } from './ImageModule';
import { TextModule } from './TextModule';
import { ChartModule } from './ChartModule';

interface ReportModuleProps {
  module: ReportModuleData;
  transaction: IComplianceTransaction;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const ReportModule: React.FC<ReportModuleProps> = ({
  module,
  transaction,
  onRemove,
  onMoveUp,
  onMoveDown
}) => {
  const renderModuleContent = () => {
    switch (module.type) {
      case 'transaction-info':
        return <TransactionInfoSummary transaction={transaction} />;
      case 'transaction-risk':
        return <TransactionRiskSummary transaction={transaction} />;
      case 'counterparty-info':
        return <CounterpartyInfoSummary transaction={transaction} />;
      case 'notes':
        return <NotesSummary transaction={transaction} />;
      case 'image':
        return <ImageModule module={module} />;
      case 'text':
        return <TextModule module={module} />;
      case 'chart':
        return <ChartModule module={module} />;
      default:
        return <div>Unknown module type</div>;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
            <CardTitle className="text-lg">{module.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onMoveUp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveUp}
                className="h-8 w-8 p-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
            {onMoveDown && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveDown}
                className="h-8 w-8 p-0"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderModuleContent()}
      </CardContent>
    </Card>
  );
};