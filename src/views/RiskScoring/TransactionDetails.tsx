import React from 'react';
import { Card, Typography, Descriptions, Tag, Space, Progress } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { TransactionInfo, RiskFactor } from '../../typings/riskScoring';
import { getRiskColor } from './utils';
import styled from 'styled-components';

const { Title, Text } = Typography;

const RiskFactorCard = styled(Card)`
  margin-top: 16px;
`;

const DetailsList = styled.ul`
  margin-top: 8px;
  padding-left: 20px;
`;

interface TransactionDetailsProps {
  transactionInfo: TransactionInfo;
}

const RiskFactorSection: React.FC<{ title: string; factor: RiskFactor }> = ({ title, factor }) => (
  <div>
    <Space align="center">
      <Text strong>{title}</Text>
      <Progress 
        percent={factor.score * 100} 
        size="small" 
        status={factor.score * 100 > 70 ? 'exception' : 'normal'}
        strokeColor={getRiskColor(factor.score * 100)}
      />
    </Space>
    <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
      {factor.description}
    </Text>
    {factor.details && (
      <DetailsList>
        {factor.details.map((detail: string, index: number) => (
          <li key={index}>
            <Text type="secondary">{detail}</Text>
          </li>
        ))}
      </DetailsList>
    )}
  </div>
);

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transactionInfo }) => {
  return (
    <>
      <Card>
        <Title level={4}>Transaction Details</Title>
        <Descriptions column={2}>
          <Descriptions.Item label="Transaction Hash">
            <Text copyable>{transactionInfo.txHash}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {transactionInfo.status === 'success' ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>Success</Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />}>Failed</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="From">
            <Text copyable>{transactionInfo.from}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="To">
            <Text copyable>{transactionInfo.to}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Value">
            {transactionInfo.value}
          </Descriptions.Item>
          <Descriptions.Item label="Timestamp">
            <Space>
              <ClockCircleOutlined />
              {transactionInfo.timestamp}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Block">
            {transactionInfo.blockNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Gas Used">
            {transactionInfo.gasUsed}
          </Descriptions.Item>
          <Descriptions.Item label="Gas Price">
            {transactionInfo.gasPrice}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <RiskFactorCard title="Risk Factor Analysis">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <RiskFactorSection title="Amount Risk" factor={transactionInfo.riskFactors.amount} />
          <RiskFactorSection title="Sender Risk" factor={transactionInfo.riskFactors.sender} />
          <RiskFactorSection title="Receiver Risk" factor={transactionInfo.riskFactors.receiver} />
          <RiskFactorSection title="Pattern Risk" factor={transactionInfo.riskFactors.pattern} />
          <RiskFactorSection title="Timing Risk" factor={transactionInfo.riskFactors.timing} />
        </Space>
      </RiskFactorCard>
    </>
  );
};

export default TransactionDetails; 