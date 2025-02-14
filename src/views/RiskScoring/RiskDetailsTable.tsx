import React from 'react';
import { Card, Table, Tabs, Space, Typography, Progress } from 'antd';
import { RiskScores, RiskDetail } from './types';
import { getRiskIcon } from './utils';
import EntityDetails from './EntityDetails';

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

  return (
    <Card style={{ marginTop: '24px' }}>
      <Tabs defaultActiveKey="transaction">
        <TabPane tab="Transaction Risk Factors" key="transaction">
          <Table 
            dataSource={riskScores.details.transaction}
            columns={columns}
            pagination={false}
          />
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
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default RiskDetailsTable; 