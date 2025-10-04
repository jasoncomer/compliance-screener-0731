import React from 'react';
import { Shield, AlertTriangle, TrendingUp, Globe } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

import { IComplianceTransaction } from '@/typings/compliance';

interface TransactionRiskSummaryProps {
  transaction: IComplianceTransaction;
}

export const TransactionRiskSummary: React.FC<TransactionRiskSummaryProps> = ({
  transaction
}) => {
  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'High Risk';
    if (score >= 60) return 'Medium-High Risk';
    if (score >= 40) return 'Medium Risk';
    if (score >= 20) return 'Low-Medium Risk';
    return 'Low Risk';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Mock risk scores - in real implementation, these would come from the transaction data
  const overallRisk = transaction.riskScores?.[0] || 25;
  const entityRisk = 23;
  const jurisdictionRisk = 25;
  const transactionRisk = 15;

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">Overall Risk Assessment</h3>
              <p className="text-sm text-gray-500">Comprehensive risk analysis</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getRiskColor(overallRisk)}`}>
                {overallRisk}
                <span className="text-lg font-normal text-gray-500">/100</span>
              </div>
              <p className={`text-sm font-medium ${getRiskColor(overallRisk)}`}>
                {getRiskLevel(overallRisk)}
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Risk Level</span>
                <span>{overallRisk}%</span>
              </div>
              <Progress 
                value={overallRisk} 
                className="h-2"
                style={{
                  '--progress-background': getProgressColor(overallRisk)
                } as React.CSSProperties}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <Label className="text-sm font-medium text-gray-600">Entity Risk</Label>
            </div>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getRiskColor(entityRisk)}`}>
                {entityRisk}
                <span className="text-sm font-normal text-gray-500">/100</span>
              </div>
              <Progress 
                value={entityRisk} 
                className="h-1"
                style={{
                  '--progress-background': getProgressColor(entityRisk)
                } as React.CSSProperties}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-5 w-5 text-orange-500" />
              <Label className="text-sm font-medium text-gray-600">Jurisdiction Risk</Label>
            </div>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getRiskColor(jurisdictionRisk)}`}>
                {jurisdictionRisk}
                <span className="text-sm font-normal text-gray-500">/100</span>
              </div>
              <Progress 
                value={jurisdictionRisk} 
                className="h-1"
                style={{
                  '--progress-background': getProgressColor(jurisdictionRisk)
                } as React.CSSProperties}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <Label className="text-sm font-medium text-gray-600">Transaction Risk</Label>
            </div>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getRiskColor(transactionRisk)}`}>
                {transactionRisk}
                <span className="text-sm font-normal text-gray-500">/100</span>
              </div>
              <Progress 
                value={transactionRisk} 
                className="h-1"
                style={{
                  '--progress-background': getProgressColor(transactionRisk)
                } as React.CSSProperties}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Factors */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Key Risk Factors</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Entity Type: Fund</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                Medium Risk
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">KYC Requirements Met</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                Low Risk
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Regulated Jurisdiction</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Low Risk
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};