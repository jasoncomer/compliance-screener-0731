/**
 * TransactionRiskModal - Refactored Version
 *
 * A reusable risk analysis modal for compliance transactions.
 * This component provides comprehensive risk analysis with entity, transaction, and jurisdiction factors.
 *
 * Key Features:
 * - Fetches transaction details and extracts input addresses
 * - Aggregates risk scores from multiple input addresses
 * - Provides comprehensive risk analysis with detailed factors
 * - Reusable across different compliance components
 * - Supports both stored and calculated risk scores
 * - Uses shadcn/ui components for consistent theming
 *
 * Usage:
 * - Unassigned transactions
 * - Active cases
 * - Transaction details
 * - Entity exploration
 */

import React, { useEffect, useState } from 'react';
import { Globe, Shield, TrendingUp, User } from 'lucide-react';

import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable, Column } from '@/components/ui/data-table';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

import { blockchain } from '../../../../api/blockchain';
import { calculateDetailedRiskAnalysis } from '../../../../services/inputTransactionRiskService';
import { BtcTransaction } from '../../../../typings/BtcTransaction';
import { IComplianceTransaction } from '../../../../typings/compliance';
import { RiskFactor } from '../../../../typings/riskScoring';

interface TransactionRiskModalProps {
  visible: boolean;
  onClose: () => void;
  transaction?: IComplianceTransaction | null;
  txId?: string;
  loading?: boolean;
  onRiskScoreUpdate?: (riskScores: AggregatedRiskScores) => void;
  showCounterPartyDetails?: boolean;
  counterpartyEntities?: string[];
  attributions?: Record<string, { entity: string }>;
  itemsMap?: Record<string, any>;
  storedRiskScores?: number[];
  title?: string;
  showRefreshButton?: boolean;
}

interface AggregatedRiskScores {
  overallRisk: number;
  entityRisk: {
    aggregateScore: number;
    factors: RiskFactor[];
  };
  jurisdictionRisk: {
    aggregateScore: number;
    factors: RiskFactor[];
  };
  transactionRisk: {
    aggregateScore: number;
    factors: RiskFactor[];
  };
  inputAddresses: string[];
  analysisType: 'transaction';
}

const TransactionRiskModalRefactored: React.FC<TransactionRiskModalProps> = ({
  visible,
  onClose,
  transaction,
  txId,
  loading = false,
  onRiskScoreUpdate,
  showCounterPartyDetails = true,
  counterpartyEntities = [],
  attributions = {},
  itemsMap = {},
  storedRiskScores: _storedRiskScores = [],
  title = "Transaction Risk Analysis",
  showRefreshButton: _showRefreshButton = false
}) => {
  const [_, setBtcTransaction] = useState<BtcTransaction | null>(null);
  const [aggregatedRiskScores, setAggregatedRiskScores] = useState<AggregatedRiskScores | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get transaction ID from either transaction prop or txId prop
  const transactionId = transaction?.txId || txId;

  // Fetch transaction details and calculate risk scores
  useEffect(() => {
    const fetchTransactionData = async () => {
      if (!transactionId || !visible) return;

      setIsLoading(true);
      try {
        // Fetch transaction details
        const txData = await blockchain.getTransaction(transactionId);
        setBtcTransaction(txData);

        // Extract input addresses
        const inputAddresses = txData.inputs
          .map(input => input.addr)
          .filter(Boolean);

        if (inputAddresses.length === 0) {
          console.warn('No input addresses found for transaction');
          setIsLoading(false);
          return;
        }

        // Calculate detailed risk analysis
        const riskData = await calculateDetailedRiskAnalysis(inputAddresses);

        const aggregated: AggregatedRiskScores = {
          overallRisk: riskData.overallRisk,
          entityRisk: {
            aggregateScore: riskData.entityRisk.aggregateScore,
            factors: riskData.entityRisk.factors || []
          },
          jurisdictionRisk: {
            aggregateScore: riskData.jurisdictionRisk.aggregateScore,
            factors: riskData.jurisdictionRisk.factors || []
          },
          transactionRisk: {
            aggregateScore: riskData.transactionRisk.aggregateScore,
            factors: riskData.transactionRisk.factors || []
          },
          inputAddresses: inputAddresses,
          analysisType: 'transaction'
        };

        setAggregatedRiskScores(aggregated);

        // Notify parent if callback provided
        if (onRiskScoreUpdate) {
          onRiskScoreUpdate(aggregated);
        }
      } catch (error) {
        console.error('Error fetching transaction data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionData();
  }, [transactionId, visible, onRiskScoreUpdate]);

  // Helper function to get risk color based on score
  const getRiskColor = (score: number): string => {
    if (score < 30) return 'text-green-600 dark:text-green-400';
    if (score < 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRiskColorForProgress = (score: number): string => {
    if (score < 30) return 'bg-green-600';
    if (score < 70) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getRiskBadgeClass = (score: number): string => {
    if (score < 30) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score < 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  // Get counter party names
  const getCounterPartyNames = () => {
    const properNames = counterpartyEntities.map((entityId) => {
      const attribution = attributions[entityId];
      const item = itemsMap[entityId];

      if (attribution?.entity) {
        return attribution.entity;
      } else if (item?.displayName) {
        return item.displayName;
      }

      return entityId;
    });

    return properNames.join(', ');
  };

  // Define columns for risk factor tables
  const riskFactorColumns: Column<RiskFactor>[] = [
    {
      title: 'Risk Factor',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground">{text}</span>
        </div>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => {
        const percentage = Math.round(score * 100);
        return (
          <div className="flex items-center gap-2">
            <Progress
              value={percentage}
              className={`h-2 w-20 ${getRiskColorForProgress(percentage)}`}
            />
            <Badge className={getRiskBadgeClass(percentage)}>
              {percentage}%
            </Badge>
          </div>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <span className="text-muted-foreground">{text}</span>
      ),
    },
  ];

  // Render risk score cards
  const renderRiskScoreCards = () => {
    if (!aggregatedRiskScores) return null;

    const overallRiskScore = Math.round(aggregatedRiskScores.overallRisk);
    const transactionRiskScore = Math.round(aggregatedRiskScores.transactionRisk.aggregateScore);
    const entityRiskScore = Math.round(aggregatedRiskScores.entityRisk.aggregateScore);
    const jurisdictionRiskScore = Math.round(aggregatedRiskScores.jurisdictionRisk.aggregateScore);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(overallRiskScore)}`}>
              {overallRiskScore}<span className="text-base font-normal">/100</span>
            </div>
            <Progress
              value={overallRiskScore}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transaction Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(transactionRiskScore)}`}>
              {transactionRiskScore}<span className="text-base font-normal">/100</span>
            </div>
            <Progress
              value={transactionRiskScore}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entity Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(entityRiskScore)}`}>
              {entityRiskScore}<span className="text-base font-normal">/100</span>
            </div>
            <Progress
              value={entityRiskScore}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jurisdiction Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(jurisdictionRiskScore)}`}>
              {jurisdictionRiskScore}<span className="text-base font-normal">/100</span>
            </div>
            <Progress
              value={jurisdictionRiskScore}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Modal
      open={visible}
      onClose={onClose}
      title={title}
      size="xl"
      className="max-w-6xl"
    >
      {(isLoading || loading) ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="large" tip="Analyzing transaction risk..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Counter party details */}
          {showCounterPartyDetails && counterpartyEntities.length > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Counter Party Entities</div>
              <div className="text-foreground font-medium mt-1">
                {getCounterPartyNames()}
              </div>
            </div>
          )}

          {/* Risk score cards */}
          {renderRiskScoreCards()}

          {/* Risk factor tabs */}
          {aggregatedRiskScores && (
            <Tabs defaultValue="entity" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="entity" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Entity Risk Factors
                </TabsTrigger>
                <TabsTrigger value="transaction" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Transaction Risk Factors
                </TabsTrigger>
                <TabsTrigger value="jurisdiction" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Jurisdiction Risk Factors
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entity" className="mt-4">
                <DataTable
                  dataSource={aggregatedRiskScores.entityRisk.factors || []}
                  columns={riskFactorColumns}
                  pagination={false}
                  size="small"
                  rowKey="id"
                  locale={{
                    emptyText: (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <User className="w-12 h-12 mb-2" />
                        <span>No entity risk factors found for this transaction</span>
                      </div>
                    )
                  }}
                />
              </TabsContent>

              <TabsContent value="transaction" className="mt-4">
                <DataTable
                  dataSource={aggregatedRiskScores.transactionRisk.factors || []}
                  columns={riskFactorColumns}
                  pagination={false}
                  size="small"
                  rowKey="id"
                  locale={{
                    emptyText: (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mb-2" />
                        <span>No transaction risk factors were found for this transaction</span>
                      </div>
                    )
                  }}
                />
              </TabsContent>

              <TabsContent value="jurisdiction" className="mt-4">
                <DataTable
                  dataSource={aggregatedRiskScores.jurisdictionRisk.factors || []}
                  columns={riskFactorColumns}
                  pagination={false}
                  size="small"
                  rowKey="id"
                  locale={{
                    emptyText: (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Globe className="w-12 h-12 mb-2" />
                        <span>No jurisdiction risk factors were found for this transaction</span>
                      </div>
                    )
                  }}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* Input addresses */}
          {aggregatedRiskScores && aggregatedRiskScores.inputAddresses.length > 0 && (
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">
                Input Addresses ({aggregatedRiskScores.inputAddresses.length})
              </div>
              <div className="space-y-1">
                {aggregatedRiskScores.inputAddresses.map((address, index) => (
                  <div key={index} className="font-mono text-xs text-foreground">
                    {address}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default TransactionRiskModalRefactored;