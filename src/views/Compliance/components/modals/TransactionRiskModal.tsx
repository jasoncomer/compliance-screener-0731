/**
 * TransactionRiskModal
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
 * 
 * Usage:
 * - Unassigned transactions
 * - Active cases
 * - Transaction details
 * - Entity exploration
 */

import React, { useEffect,useState } from 'react';

import { GlobalOutlined, SafetyOutlined,TransactionOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Empty, Modal, Progress, Space, Spin,Statistic, Table, Tabs, Typography } from 'antd';

import { colors } from '@/design-system/tokens';

import { blockchain } from '../../../../api/blockchain';
import { useTheme } from '../../../../context/ThemeContext';
import { calculateDetailedRiskAnalysis } from '../../../../services/inputTransactionRiskService';
import { BtcTransaction } from '../../../../typings/BtcTransaction';
import { IComplianceTransaction } from '../../../../typings/compliance';
import { RiskFactor } from '../../../../typings/riskScoring';

import './RiskScoreModal.css';

const { Text } = Typography;

interface TransactionRiskModalProps {
  visible: boolean;
  onClose: () => void;
  transaction?: IComplianceTransaction | null;
  txId?: string;
  loading?: boolean;
  // Optional props for future extensibility
  onRiskScoreUpdate?: (riskScores: AggregatedRiskScores) => void;
  showCounterPartyDetails?: boolean;
  // Counter party information
  counterpartyEntities?: string[];
  attributions?: Record<string, { entity: string }>;
  itemsMap?: Record<string, any>;
  // Stored risk scores from the transaction (if available)
  storedRiskScores?: number[];
  // Modal title customization
  title?: string;
  // Show refresh button
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

const TransactionRiskModal: React.FC<TransactionRiskModalProps> = ({ 
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
  storedRiskScores = [],
  title = "Transaction Risk Analysis",
  showRefreshButton = false
}) => {
  const { theme } = useTheme();
  const [_, setBtcTransaction] = useState<BtcTransaction | null>(null);
  const [aggregatedRiskScores, setAggregatedRiskScores] = useState<AggregatedRiskScores | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get transaction ID from either transaction prop or txId prop
  const transactionId = transaction?.txId || txId;

  // Fetch transaction details and aggregate risk scores
  useEffect(() => {
    if (visible && transactionId) {
      fetchTransactionAndAggregateRisk();
    }
  }, [visible, transactionId]);

  const fetchTransactionAndAggregateRisk = async () => {
    if (!transactionId) return;
    
    setIsLoading(true);
    try {
      // Fetch transaction details
      const txData = await blockchain.getTransaction(transactionId);
      setBtcTransaction(txData);

      // Get input addresses
      const inputAddresses = txData.inputs.map(input => input.addr).filter(Boolean);
      
      if (inputAddresses.length === 0) {
        console.warn('No input addresses found for transaction');
        return;
      }

      // Always calculate detailed risk analysis to get factors, but use stored scores for display if available
      console.log('Calculating detailed risk analysis for factors');
      const detailedRisk = await calculateDetailedRiskAnalysis(inputAddresses);

      let aggregatedRisk: AggregatedRiskScores;
      
      if (storedRiskScores && storedRiskScores.length >= 4) {
        // Use stored risk scores but keep the detailed factors from calculation
        console.log('Using stored risk scores with calculated factors:', storedRiskScores);
        aggregatedRisk = {
          overallRisk: storedRiskScores[0],
          entityRisk: {
            aggregateScore: storedRiskScores[1],
            factors: detailedRisk.entityRisk.factors
          },
          jurisdictionRisk: {
            aggregateScore: storedRiskScores[2],
            factors: detailedRisk.jurisdictionRisk.factors
          },
          transactionRisk: {
            aggregateScore: storedRiskScores[3],
            factors: detailedRisk.transactionRisk.factors
          },
          inputAddresses,
          analysisType: 'transaction'
        };
      } else {
        // Use the calculated risk scores and factors
        console.log('Using calculated risk scores and factors');
        aggregatedRisk = detailedRisk;
      }

      setAggregatedRiskScores(aggregatedRisk);
      
      // Notify parent component of risk score update if callback provided
      if (onRiskScoreUpdate) {
        onRiskScoreUpdate(aggregatedRisk);
      }
    } catch (error) {
      console.error('Error fetching transaction risk data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (score: number): string => {
    if (score > 70) return '#cf1322';
    if (score > 40) return '#faad14';
    return '#3f8600';
  };

  const getRiskIcon = () => {
    return <SafetyOutlined style={{ color: getRiskColor(70) }} />;
  };

  const getCounterPartyName = () => {
    const entities = counterpartyEntities.length > 0 ? counterpartyEntities : (transaction?.counterpartyEntities || []);
    
    if (entities.length === 0) {
      return 'Unknown';
    }

    // Try to get proper names from attributions or itemsMap
    const properNames = entities.map(entityId => {
      // First try attributions
      if (attributions[entityId]?.entity) {
        return attributions[entityId].entity;
      }
      
      // Then try itemsMap
      if (itemsMap[entityId]?.proper_name) {
        return itemsMap[entityId].proper_name;
      }
      
      // Fallback to entity ID
      return entityId;
    });

    return properNames.join(', ');
  };

  const columns = [
    {
      title: 'Risk Factor',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, _record: RiskFactor) => (
        <Space>
          {getRiskIcon()}
          <Text style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Progress
          percent={Math.round(score * 100)}
          size="small"
          status="normal"
          strokeColor={getRiskColor(Math.round(score * 100))}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>{text}</Text>,
    },
  ];

  const renderRiskScoreCards = () => {
    if (!aggregatedRiskScores) return null;

    const overallRiskScore = Math.round(aggregatedRiskScores.overallRisk);
    const transactionRiskScore = Math.round(aggregatedRiskScores.transactionRisk.aggregateScore);
    const entityRiskScore = Math.round(aggregatedRiskScores.entityRisk.aggregateScore);
    const jurisdictionRiskScore = Math.round(aggregatedRiskScores.jurisdictionRisk.aggregateScore);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <Statistic
            title={<Text style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>Overall Risk Score</Text>}
            value={overallRiskScore}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(overallRiskScore)
            }}
          />
          <Progress 
            percent={overallRiskScore}
            status={overallRiskScore > 70 ? 'exception' : 'normal'} 
            strokeColor={getRiskColor(overallRiskScore)}
            format={(percent) => `${percent}%`}
          />
        </Card>
        
        <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <Statistic
            title={<Text style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>Transaction Risk</Text>}
            value={transactionRiskScore}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(transactionRiskScore)
            }}
          />
          <Progress 
            percent={transactionRiskScore}
            status={transactionRiskScore > 70 ? 'exception' : 'normal'} 
            strokeColor={getRiskColor(transactionRiskScore)}
            format={(percent) => `${percent}%`}
          />
        </Card>
        
        <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <Statistic
            title={<Text style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>Entity Risk</Text>}
            value={entityRiskScore}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(entityRiskScore)
            }}
          />
          <Progress 
            percent={entityRiskScore}
            status={entityRiskScore > 70 ? 'exception' : 'normal'} 
            strokeColor={getRiskColor(entityRiskScore)}
            format={(percent) => `${percent}%`}
          />
        </Card>
        
        <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
          <Statistic
            title={<Text style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>Jurisdiction Risk</Text>}
            value={jurisdictionRiskScore}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(jurisdictionRiskScore)
            }}
          />
          <Progress 
            percent={jurisdictionRiskScore}
            status={jurisdictionRiskScore > 70 ? 'exception' : 'normal'} 
            strokeColor={getRiskColor(jurisdictionRiskScore)}
            format={(percent) => `${percent}%`}
          />
        </Card>
      </div>
    );
  };

  const tabItems = [
    {
      key: 'entity',
      label: (
        <span style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
          <UserOutlined style={{ marginRight: 8 }} />
          Entity Risk Factors
        </span>
      ),
      children: (
        <Table
          dataSource={aggregatedRiskScores?.entityRisk.factors || []}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                image={<TransactionOutlined style={{ fontSize: 40, color: colors.attribution.hover }} />}
                description="No entity risk factors found for this transaction"
              />
            )
          }}
        />
      ),
    },
    {
      key: 'transaction',
      label: (
        <span style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
          <TransactionOutlined style={{ marginRight: 8 }} />
          Transaction Risk Factors
        </span>
      ),
      children: (
        <Table
          dataSource={aggregatedRiskScores?.transactionRisk.factors || []}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                image={<TransactionOutlined style={{ fontSize: 40, color: colors.attribution.hover }} />}
                description="No transaction risk factors were found for this transaction"
              />
            )
          }}
        />
      ),
    },
    {
      key: 'jurisdiction',
      label: (
        <span style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
          <GlobalOutlined style={{ marginRight: 8 }} />
          Jurisdiction Risk Factors
        </span>
      ),
      children: (
        <Table
          dataSource={aggregatedRiskScores?.jurisdictionRisk.factors || []}
          columns={columns}
          pagination={false}
          size="small"
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                image={<GlobalOutlined style={{ fontSize: 40, color: colors.attribution.hover }} />}
                description="No jurisdiction risk factors were found for this transaction"
              />
            )
          }}
        />
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SafetyOutlined style={{ color: colors.attribution.hover }} />
            <span style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>{title}</span>
          </div>
          {showRefreshButton && (
            <button
              onClick={fetchTransactionAndAggregateRisk}
              disabled={isLoading}
              style={{
                marginLeft: '16px',
                padding: '4px 8px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                background: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      styles={{
        body: {
          backgroundColor: theme === 'light' ? '#ffffff' : '#111827', 
          color: theme === 'light' ? '#374151' : '#e5e7eb',
          maxHeight: '80vh',
          overflowY: 'auto'
        }
      }}
      className={`risk-score-modal ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}
    >
      <Spin spinning={isLoading || loading}>
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>Transaction ID: </Text>
          <Text style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
            <code>{transactionId}</code>
          </Text>
        </div>

        {aggregatedRiskScores && (
          <>
            {showCounterPartyDetails && (
              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>Counter Party: </Text>
                <Text style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                  {getCounterPartyName()}
                </Text>
              </div>
            )}

            {renderRiskScoreCards()}

            <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
              <Tabs
                defaultActiveKey="entity"
                items={tabItems}
                style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}
              />
            </Card>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default TransactionRiskModal;