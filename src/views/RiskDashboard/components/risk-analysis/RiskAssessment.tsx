import React from 'react';

import { AlertTriangle, CheckCircle, CreditCard, Globe, Info, Loader2, Shield, User, XCircle } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useTheme } from "../../../../context/ThemeContext";
import { RiskFactor, RiskScoringResponse } from '../../../../typings/riskScoring';

interface RiskAssessmentProps {
  riskScores: RiskScoringResponse | null;
  address: string;
  isLoading?: boolean;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ 
  riskScores,
  address,
  isLoading = false
}) => {
  const { theme } = useTheme();

  const getRiskColor = (score: number): string => {
    if (score >= 80) return '#ef4444'; // Red for high risk
    if (score >= 50) return '#f59e0b'; // Orange for medium risk
    if (score >= 20) return '#10b981'; // Green for low risk
    return '#6b7280'; // Gray for very low risk
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 80) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const getRiskDescription = (score: number): string => {
    if (score >= 80) {
      return 'This address shows significant risk indicators including high transaction volumes, connections to known risky entities, and unusual activity patterns.';
    } else if (score >= 50) {
      return 'This address displays moderate risk factors with some concerning transaction patterns and entity connections that warrant attention.';
    } else if (score >= 20) {
      return 'This address shows low risk indicators with mostly normal transaction patterns and few concerning connections.';
    } else {
      return 'This address appears to be low risk with normal transaction patterns and no significant concerning indicators.';
    }
  };

  const getRiskIcon = (severity: string) => {
    if (severity === 'high') return <XCircle className="w-4 h-4 text-red-500" />;
    if (severity === 'medium') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getRiskScore = (value: number | undefined): number => {
    if (value === undefined || value === null) return 0;
    if (value > 1) return Math.round(value);
    return Math.round(value * 100);
  };

  const renderRiskTable = (factors: RiskFactor[], emptyIcon: React.ReactNode, emptyText: string) => {
    if (!factors || factors.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <div className="mb-3">{emptyIcon}</div>
          <p>{emptyText}</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk Factor</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {factors.map((factor) => (
              <TableRow key={factor.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getRiskIcon(factor.severity)}
                    <span>{factor.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${factor.score * 100}%`,
                          backgroundColor: getRiskColor(factor.score * 100)
                        }}
                      />
                    </div>
                    <span className="text-sm">{(factor.score * 100).toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-400">
                  {factor.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`rounded-2xl border p-6 h-full flex flex-col justify-center items-center ${
        theme === 'dark' 
          ? 'bg-gray-50 dark:bg-background border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h5 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Risk Assessment</h5>
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
        <div className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Loading risk data...</div>
      </div>
    );
  }

  if (!riskScores) {
    return (
      <div className={`rounded-2xl border p-6 h-full flex flex-col justify-center items-center ${
        theme === 'dark' 
          ? 'bg-gray-50 dark:bg-background border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h5 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Risk Assessment</h5>
        <div className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>No risk score data available for this address.</div>
      </div>
    );
  }

  const overallRiskScore = getRiskScore(riskScores.overallRisk);
  const transactionRiskScore = getRiskScore(riskScores.transactionRisk?.aggregateScore);
  const entityRiskScore = getRiskScore(riskScores.entityRisk?.aggregateScore);
  const jurisdictionRiskScore = getRiskScore(riskScores.jurisdictionRisk?.aggregateScore);
  
  const riskColor = getRiskColor(overallRiskScore);
  const level = getRiskLevel(overallRiskScore);
  const description = getRiskDescription(overallRiskScore);

  const RiskCard = ({ title, score, icon: Icon }: { title: string; score: number; icon?: React.ComponentType<{ className?: string }> }) => (
    <div className={`border rounded-lg p-4 ${
      theme === 'dark' 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <div className={`text-sm font-medium ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>{title}</div>
      </div>
      <div className="text-3xl font-bold mb-2" style={{ color: getRiskColor(score) }}>
        {score}<span className={`text-lg font-normal ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>/100</span>
      </div>
      <div className={`w-full rounded-full h-2 ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: getRiskColor(score)
          }}
        />
      </div>
    </div>
  );

  return (
    <div className={`rounded-2xl border p-4 ${
      theme === 'dark' 
        ? 'bg-gray-50 dark:bg-background border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-orange-500" />
          <h5 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Risk Assessment</h5>
        </div>
        <div className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Address: <code className={`text-xs px-2 py-1 rounded ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>{address}</code>
        </div>
      </div>

      {/* Overall Risk Score - Prominent Display */}
      <div className={`mb-4 p-4 rounded-xl border-2 flex-shrink-0 ${
        theme === 'dark' 
          ? 'bg-gray-900/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield className="w-12 h-12" style={{ color: riskColor }} />
            <div>
              <div className="text-5xl font-bold" style={{ color: riskColor }}>
                {overallRiskScore}
                <span className={`text-2xl font-normal ml-2 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>/100</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="font-semibold text-xl" style={{ color: riskColor }}>
                  {level} Risk
                </div>
                <div className="relative group">
                  <Info 
                    className="w-4 h-4 cursor-help text-gray-500 dark:text-gray-400" 
                  />
                  <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 min-w-[300px] max-w-[400px] ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-gray-200 border border-gray-700' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    {description}
                    <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                      theme === 'dark' 
                        ? 'border-t-gray-800' 
                        : 'border-t-white'
                    }`}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BO Override Information */}
          {riskScores.boInfo?.isBeneficialOwnerOverride && (
            <div className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 max-w-xs">
              <div className="text-xs text-orange-600 dark:text-orange-400 mb-1 font-medium">
                Risk from Beneficial Owner:
              </div>
              <div className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
                {riskScores.boInfo.entityName}
              </div>
              {riskScores.boInfo.ofac && (
                <div className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded">
                  OFAC SANCTIONED
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Risk Score Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 flex-shrink-0">
        <RiskCard title="Entity Risk" score={entityRiskScore} icon={User} />
        <RiskCard title="Transaction Risk" score={transactionRiskScore} icon={CreditCard} />
        <RiskCard title="Jurisdiction Risk" score={jurisdictionRiskScore} icon={Globe} />
      </div>

      {/* Detailed Risk Factors - Tabs */}
      <div className={`border rounded-lg p-3 ${
        theme === 'dark' 
          ? 'bg-gray-900/50 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h6 className={`text-base font-semibold mb-3 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Risk Factor Details</h6>
        
        <Tabs defaultValue="entity" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-3">
            <TabsTrigger value="entity" className="flex items-center gap-2 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Entity Risk</span>
              <span className="sm:hidden">Entity</span>
            </TabsTrigger>
            <TabsTrigger value="transaction" className="flex items-center gap-2 text-xs sm:text-sm">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Transaction Risk</span>
              <span className="sm:hidden">Transaction</span>
            </TabsTrigger>
            <TabsTrigger value="jurisdiction" className="flex items-center gap-2 text-xs sm:text-sm">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Jurisdiction Risk</span>
              <span className="sm:hidden">Jurisdiction</span>
            </TabsTrigger>
          </TabsList>

          <div>
            <TabsContent value="entity" className="mt-0">
              <div>
                {renderRiskTable(
                  riskScores.entityRisk?.factors || [],
                  <User className="w-8 h-8" />,
                  'No entity risk factors were found for this address'
                )}
              </div>
            </TabsContent>

            <TabsContent value="transaction" className="mt-0">
              <div>
                {renderRiskTable(
                  riskScores.transactionRisk?.factors || [],
                  <CreditCard className="w-8 h-8" />,
                  'No transaction risk factors were found for this address'
                )}
              </div>
            </TabsContent>

            <TabsContent value="jurisdiction" className="mt-0">
              <div>
                {renderRiskTable(
                  riskScores.jurisdictionRisk?.factors || [],
                  <Globe className="w-8 h-8" />,
                  'No jurisdiction risk data available for this address'
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default RiskAssessment;