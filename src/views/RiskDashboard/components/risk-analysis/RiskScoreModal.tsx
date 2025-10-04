import React from 'react';

import { AlertTriangle, CheckCircle, CreditCard, Globe, Shield, User, XCircle } from 'lucide-react';

import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { colors } from '@/design-system/tokens';


import { RiskFactor, RiskScoringResponse } from '../../../../typings/riskScoring';

interface RiskScoreModalProps {
  visible: boolean;
  onClose: () => void;
  riskScores: RiskScoringResponse | null;
  address: string;
  loading?: boolean;
}

const RiskScoreModal: React.FC<RiskScoreModalProps> = ({ riskScores, visible, onClose, address, loading }) => {

  const getRiskColor = (score: number): string => {
    if (score > 70) return colors.semantic.danger;
    if (score > 40) return colors.semantic.warning;
    return colors.semantic.success;
  };

  const getRiskIcon = (severity: string) => {
    if (severity === 'high') return <XCircle className="w-4 h-4 text-red-500" />;
    if (severity === 'medium') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const renderRiskScoreCards = () => {
    if (!riskScores) return null;

    const getRiskScore = (value: number | undefined): number => {
      if (value === undefined || value === null) return 0;
      if (value > 1) return Math.round(value);
      return Math.round(value * 100);
    };

    const overallRiskScore = getRiskScore(riskScores.overallRisk);
    const transactionRiskScore = getRiskScore(riskScores.transactionRisk?.aggregateScore);
    const entityRiskScore = getRiskScore(riskScores.entityRisk?.aggregateScore);
    const jurisdictionRiskScore = getRiskScore(riskScores.jurisdictionRisk?.aggregateScore);

    const RiskCard = ({ title, score }: { title: string; score: number }) => (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{title}</div>
        <div className="text-3xl font-bold mb-2" style={{ color: getRiskColor(score) }}>
          {score}<span className="text-lg text-gray-500 dark:text-gray-400">/100</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <RiskCard title="Overall Risk Score" score={overallRiskScore} />
        <RiskCard title="Transaction Risk" score={transactionRiskScore} />
        <RiskCard title="Entity Risk" score={entityRiskScore} />
        <RiskCard title="Jurisdiction Risk" score={jurisdictionRiskScore} />
      </div>
    );
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

  return (
    <Modal
      open={visible}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span>Risk Score Details</span>
        </div>
      }
      className="min-w-[800px] min-h-[600px]"
      bodyClassName="max-h-[80vh] overflow-y-auto"
    >
      <div className="mb-4">
        <span className="text-gray-600 dark:text-gray-400">Address: </span>
        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{address}</code>
      </div>

      {loading ? (
        <div className="text-center p-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="mt-4 text-gray-600 dark:text-gray-400">Loading risk analysis...</div>
        </div>
      ) : riskScores ? (
        <div>
          {renderRiskScoreCards()}

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <Tabs defaultValue="entity">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="entity">
                  <User className="w-4 h-4 mr-2" />
                  Entity Risk
                </TabsTrigger>
                <TabsTrigger value="transaction">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Transaction Risk
                </TabsTrigger>
                <TabsTrigger value="jurisdiction">
                  <Globe className="w-4 h-4 mr-2" />
                  Jurisdiction Risk
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entity">
                {renderRiskTable(
                  riskScores.entityRisk?.factors || [],
                  <User className="w-8 h-8" />,
                  'No entity risk factors were found for this address'
                )}
              </TabsContent>

              <TabsContent value="transaction">
                {renderRiskTable(
                  riskScores.transactionRisk?.factors || [],
                  <CreditCard className="w-8 h-8" />,
                  'No transaction risk factors were found for this address'
                )}
              </TabsContent>

              <TabsContent value="jurisdiction">
                {renderRiskTable(
                  riskScores.jurisdictionRisk?.factors || [],
                  <Globe className="w-8 h-8" />,
                  'No jurisdiction risk data available for this address'
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      ) : (
        <div className="text-center p-10 text-gray-600 dark:text-gray-400">
          No risk score data available for this address.
        </div>
      )}
    </Modal>
  );
};

export default RiskScoreModal;