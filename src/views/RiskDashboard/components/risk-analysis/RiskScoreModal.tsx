import React from 'react';

import { Card, Empty,Modal, Progress, Space, Statistic, Table, Tabs, Typography } from 'antd';
import { AlertTriangle, CheckCircle, CreditCard, Globe, Shield,User, XCircle } from 'lucide-react';

import { colors } from '@/design-system/tokens'

import { useTheme } from '../../../../context/ThemeContext';
import { RiskFactor,RiskScoringResponse } from '../../../../typings/riskScoring';

const { Text } = Typography;

interface RiskScoreModalProps {
  visible: boolean;
  onClose: () => void;
  riskScores: RiskScoringResponse | null;
  address: string;
  loading?: boolean;
}

const RiskScoreModal: React.FC<RiskScoreModalProps> = ({ riskScores, visible, onClose, address, loading }) => {
  useTheme(); // Used for theme context

  const getRiskColor = (score: number): string => {
    if (score > 70) return colors.semantic.danger;
    if (score > 40) return colors.semantic.warning;
    return colors.semantic.success;
  };

  const getRiskIcon = (severity: string) => {
    if (severity === 'high') return <XCircle className="w-4 h-4" style={{ color: colors.semantic.danger }} />;
    if (severity === 'medium') return <AlertTriangle className="w-4 h-4" style={{ color: colors.semantic.warning }} />;
    return <CheckCircle className="w-4 h-4" style={{ color: colors.semantic.success }} />;
  };

  const columns = [
    {
      title: 'Risk Factor',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: RiskFactor) => (
        <Space>
          {getRiskIcon(record.severity)}
          <Text style={{ color: colors.gray[800] }}>{text}</Text>
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
            strokeColor={getRiskColor(score * 100)}
            format={formatPercent}
          />
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text style={{ color: colors.gray[600] }}>{text}</Text>,
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
         <Card style={{ backgroundColor: colors.white, borderColor: colors.gray[200] }}>
           <Statistic
             title={<Text style={{ color: colors.gray[800] }}>Overall Risk Score</Text>}
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
         
         <Card style={{ backgroundColor: colors.white, borderColor: colors.gray[200] }}>
           <Statistic
             title={<Text style={{ color: colors.gray[800] }}>Transaction Risk</Text>}
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
         
         <Card style={{ backgroundColor: colors.white, borderColor: colors.gray[200] }}>
           <Statistic
             title={<Text style={{ color: colors.gray[800] }}>Entity Risk</Text>}
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
         
         <Card style={{ backgroundColor: colors.white, borderColor: colors.gray[200] }}>
           <Statistic
             title={<Text style={{ color: colors.gray[800] }}>Jurisdiction Risk</Text>}
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
          <Shield className="w-5 h-5" style={{ color: colors.brand.primary }} />
          <span style={{ color: colors.gray[800] }}>Risk Score Details</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
      styles={{
        body: {
          backgroundColor: colors.white,
          color: colors.gray[800],
          maxHeight: '80vh',
          overflowY: 'auto'
        }
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Text style={{ color: colors.gray[600] }}>Address: </Text>
        <Text code style={{ color: colors.gray[800] }}>{address}</Text>
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
          <div style={{ marginTop: '16px', color: colors.gray[600] }}>Loading risk analysis...</div>
        </div>
      ) : riskScores ? (
        <div>
          {renderRiskScoreCards()}
          
          <Card style={{ backgroundColor: colors.white, borderColor: colors.gray[200] }}>
            <Tabs 
              defaultActiveKey="entity"
              style={{ color: colors.gray[800] }}
              items={[
                {
                  key: 'entity',
                  label: (
                    <span style={{ color: colors.gray[800] }}>
                      <User className="w-4 h-4 inline mr-2" />
                      Entity Risk Factors
                    </span>
                  ),
                  children: (
                    <Table 
                      dataSource={riskScores.entityRisk?.factors || []}
                      columns={columns}
                      pagination={false}
                       locale={{ emptyText: customEmptyState(<User className="w-8 h-8" />, 'No entity risk factors were found for this address') }}
                      rowKey="id"
                      style={{ width: '100%' }}
                      className="risk-table"
                    />
                  ),
                },
                {
                  key: 'transaction',
                  label: (
                    <span style={{ color: colors.gray[800] }}>
                      <CreditCard className="w-4 h-4 inline mr-2" />
                      Transaction Risk Factors
                    </span>
                  ),
                  children: (
                    <Table 
                      dataSource={riskScores.transactionRisk?.factors || []}
                      columns={columns}
                      pagination={false}
                      rowKey="id"
                       locale={{ emptyText: customEmptyState(<CreditCard className="w-8 h-8" />, 'No transaction risk factors were found for this address') }}
                      style={{ width: '100%' }}
                      className="risk-table"
                    />
                  ),
                },
                {
                  key: 'jurisdiction',
                  label: (
                    <span style={{ color: colors.gray[800] }}>
                      <Globe className="w-4 h-4 inline mr-2" />
                      Jurisdiction Risk Factors
                    </span>
                  ),
                  children: (
                    <Table 
                      dataSource={riskScores.jurisdictionRisk?.factors || []}
                      columns={columns}
                      pagination={false}
                      rowKey="id"
                       locale={{ emptyText: customEmptyState(<Globe className="w-8 h-8" />, 'No jurisdiction risk data available for this address') }}
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
         <div style={{ textAlign: 'center', padding: '40px', color: colors.gray[600] }}>
           No risk score data available for this address.
            </div>
          )}
    </Modal>
  );
};

export default RiskScoreModal; 