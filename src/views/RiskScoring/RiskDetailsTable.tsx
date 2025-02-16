import React from 'react';
import { Card, Table, Tabs, Space, Typography, Progress } from 'antd';
import { RiskScoringResponse, RiskFactor } from '../../types/riskScoring';
import { getRiskIcon } from './utils';
import JurisdictionMap from './JurisdictionMap';
import EntityDetails from './EntityDetails';

// import TransactionDetails from './TransactionDetails';

const { TabPane } = Tabs;
const { Text } = Typography;

interface RiskDetailsTableProps {
  riskScores: RiskScoringResponse;
}

const RiskDetailsTable: React.FC<RiskDetailsTableProps> = ({ riskScores }) => {
  const columns = [
    {
      title: 'Risk Factor',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: RiskFactor) => (
        <Space>
          {getRiskIcon(record.severity)}
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Progress 
          percent={score * 100} 
          size="small" 
          status={score * 100 > 70 ? 'exception' : 'normal'} 
          strokeColor={score * 100 > 70 ? '#cf1322' : score * 100 > 40 ? '#faad14' : '#3f8600'}
        />
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  if (riskScores.analysisType !== 'address') {
    return null;
  }

  console.log('riskScores', riskScores);
  return (
    <Card style={{ marginTop: '24px' }}>
      <Tabs defaultActiveKey="transaction">
        <TabPane tab="Transaction Risk Factors" key="transaction">
          <Table 
            dataSource={riskScores.transactionRisk.factors}
            columns={columns}
            pagination={false}
          />
          {/* <TransactionDetails transactionInfo={riskScores.transactionInfo} /> */}
        </TabPane>
        <TabPane tab="Entity Risk Factors" key="entity">
          <Table 
            dataSource={riskScores.entityRisk.factors}
            columns={columns}
            pagination={false}
          />
          {riskScores.sot && (
            <EntityDetails sot={riskScores.sot} />
          )}
        </TabPane>
        <TabPane tab="Jurisdiction Risk Factors" key="jurisdiction">
          <Table 
            dataSource={riskScores.jurisdictionRisk.factors}
            columns={columns}
            pagination={false}
          />
          <JurisdictionMap 
            countries={riskScores.sot?.associated_countries} 
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default RiskDetailsTable; 