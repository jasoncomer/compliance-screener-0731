import React from 'react';
import { Modal, Card, Statistic, Progress, Table, Tabs, Space, Typography, Empty } from 'antd';
import { UserOutlined, TransactionOutlined, GlobalOutlined, SafetyOutlined } from '@ant-design/icons';
import { RiskScoringResponse, RiskFactor } from '../../../../typings/riskScoring';
import { colors } from '@/design-system/tokens'
import { useTheme } from '../../../../context/ThemeContext';
import './RiskScoreModal.css';

const { Text } = Typography;

interface RiskScoreModalProps {
  visible: boolean;
  onClose: () => void;
  riskScores: RiskScoringResponse | null;
  address: string;
  loading?: boolean;
}

const RiskScoreModal: React.FC<RiskScoreModalProps> = ({ 
  visible, 
  onClose, 
  riskScores, 
  address,
  loading = false 
}) => {
  const { theme } = useTheme();

  const getRiskColor = (score: number): string => {
    if (score > 70) return '#cf1322';
    if (score > 40) return '#faad14';
    return '#3f8600';
  };

  const getRiskIcon = (severity: string) => {
    if (severity === 'high') return <SafetyOutlined style={{ color: '#cf1322' }} />;
    if (severity === 'medium') return <SafetyOutlined style={{ color: '#faad14' }} />;
    return <SafetyOutlined style={{ color: '#3f8600' }} />;
  };

  const columns = [
    {
      title: 'Risk Factor',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: RiskFactor) => (
        <Space>
          {getRiskIcon(record.severity)}
          <Text style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => {
        const formatPercent = (percent?: number) => {
          if (percent === undefined) return '0%';
          return `${percent}%`;
        };
        
        return (
          <Progress 
            percent={Number((score * 100).toFixed(2))} 
            size="small" 
            status={score * 100 > 70 ? 'exception' : 'normal'} 
            strokeColor={score * 100 > 70 ? '#cf1322' : score * 100 > 40 ? '#faad14' : '#3f8600'}
            format={formatPercent}
          />
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>{text}</Text>,
    },
  ];

  const renderRiskScoreCards = () => {
    if (!riskScores) return null;


    // Handle different possible data formats
    const getRiskScore = (value: number | undefined): number => {
      if (value === undefined || value === null) return 0;
      // If value is already in 0-100 range, use it directly
      if (value > 1) return Math.round(value);
      // If value is in 0-1 range, convert to percentage
      return Math.round(value * 100);
    };

    const overallRiskScore = getRiskScore(riskScores.overallRisk);
    const transactionRiskScore = getRiskScore(riskScores.transactionRisk?.aggregateScore);
    const entityRiskScore = getRiskScore(riskScores.entityRisk?.aggregateScore);
    const jurisdictionRiskScore = getRiskScore(riskScores.jurisdictionRisk?.aggregateScore);


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

  const customEmptyState = (icon: React.ReactNode, description: string) => (
    <Empty
      image={icon}
      imageStyle={{ height: 40, color: colors.brand.primary }}
      description={<Text style={{ color: colors.brand.primary }}>{description}</Text>}
    />
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SafetyOutlined style={{ color: colors.attribution.hover }} />
          <span style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>Risk Score Details</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      bodyStyle={{ 
        backgroundColor: theme === 'light' ? '#ffffff' : '#111827', 
        color: theme === 'light' ? '#374151' : '#e5e7eb',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
      className={`risk-score-modal ${theme === 'light' ? 'light-theme' : 'dark-theme'}`}
    >
      <div style={{ marginBottom: '16px' }}>
        <Text style={{ color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>Address: </Text>
        <Text code style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>{address}</Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="ant-spin ant-spin-lg ant-spin-spinning">
            <span className="ant-spin-dot ant-spin-dot-spin">
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
              <i className="ant-spin-dot-item"></i>
            </span>
          </div>
          <div style={{ marginTop: '16px', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>Loading risk analysis...</div>
        </div>
      ) : riskScores ? (
        <div>
          {renderRiskScoreCards()}
          
          <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}`}>
            <Tabs 
              defaultActiveKey="entity"
              style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}
              items={[
                {
                  key: 'entity',
                  label: (
                    <span style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                      <UserOutlined style={{ marginRight: '8px' }} />
                      Entity Risk Factors
                    </span>
                  ),
                  children: (
                    <Table 
                      dataSource={riskScores.entityRisk?.factors || []}
                      columns={columns}
                      pagination={false}
                      locale={{ emptyText: customEmptyState(<UserOutlined />, 'No entity risk factors were found for this address') }}
                      rowKey="id"
                      style={{ width: '100%' }}
                      className="risk-table"
                    />
                  ),
                },
                {
                  key: 'transaction',
                  label: (
                    <span style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                      <TransactionOutlined style={{ marginRight: '8px' }} />
                      Transaction Risk Factors
                    </span>
                  ),
                  children: (
                    <Table 
                      dataSource={riskScores.transactionRisk?.factors || []}
                      columns={columns}
                      pagination={false}
                      rowKey="id"
                      locale={{ emptyText: customEmptyState(<TransactionOutlined />, 'No transaction risk factors were found for this address') }}
                      style={{ width: '100%' }}
                      className="risk-table"
                    />
                  ),
                },
                {
                  key: 'jurisdiction',
                  label: (
                    <span style={{ color: theme === 'light' ? '#374151' : '#e5e7eb' }}>
                      <GlobalOutlined style={{ marginRight: '8px' }} />
                      Jurisdiction Risk Factors
                    </span>
                  ),
                  children: (
                    <Table 
                      dataSource={riskScores.jurisdictionRisk?.factors || []}
                      columns={columns}
                      pagination={false}
                      rowKey="id"
                      locale={{ emptyText: customEmptyState(<GlobalOutlined />, 'No jurisdiction risk data available for this address') }}
                      style={{ width: '100%' }}
                      className="risk-table"
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: theme === 'light' ? '#6b7280' : '#9ca3af' }}>
          No risk score data available for this address.
        </div>
      )}
    </Modal>
  );
};

export default RiskScoreModal; 