import React from 'react';
import { Card, Table, Tabs, Space, Typography, Progress } from 'antd';
import { RiskScores } from '../../types/newRiskScoring';
import { getRiskIcon } from './utils';
import JurisdictionMap from './JurisdictionMap';
import EntityDetails from './EntityDetails';
import { RiskDetail } from '../../types/riskScoring';
import TransactionDetails from './TransactionDetails';
const { TabPane } = Tabs;
const { Text } = Typography;

interface RiskDetailsTableProps {
  riskScores: RiskScores;
}

const RiskDetailsTable: React.FC<RiskDetailsTableProps> = ({ riskScores }) => {
  const columns = [
    {
      title: 'Risk Factor',
      dataIndex: 'factor',
      key: 'factor',
      render: (text: string, record: RiskDetail) => (
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
          percent={score} 
          size="small" 
          status={score > 70 ? 'exception' : 'normal'} 
          strokeColor={score > 70 ? '#cf1322' : score > 40 ? '#faad14' : '#3f8600'}
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
            dataSource={riskScores.details.transaction}
            columns={columns}
            pagination={false}
          />
          {/* <TransactionDetails transactionInfo={riskScores.transactionInfo} /> */}
        </TabPane>
        <TabPane tab="Entity Risk Factors" key="entity">
          <Table 
            dataSource={riskScores.details.entity}
            columns={columns}
            pagination={false}
          />
          {riskScores.entityInfo && (
            <EntityDetails entityInfo={riskScores.entityInfo} />
          )}
        </TabPane>
        <TabPane tab="Jurisdiction Risk Factors" key="jurisdiction">
          <Table 
            dataSource={riskScores.details.jurisdiction}
            columns={columns}
            pagination={false}
          />
          <JurisdictionMap 
            countries={riskScores.entityInfo?.associated_countries} 
          />
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default RiskDetailsTable; 