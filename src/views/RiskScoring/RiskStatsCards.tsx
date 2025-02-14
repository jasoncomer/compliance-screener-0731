import React from 'react';
import { Row, Col, Card, Statistic, Progress } from 'antd';
import { RiskScores } from './types';
import { getRiskColor } from './utils';

interface RiskStatsCardsProps {
  riskScores: RiskScores;
}

const RiskStatsCards: React.FC<RiskStatsCardsProps> = ({ riskScores }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card>
          <Statistic
            title="Overall Risk Score"
            value={riskScores.overallRisk}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(riskScores.overallRisk)
            }}
          />
          <Progress 
            percent={riskScores.overallRisk} 
            status={riskScores.overallRisk > 70 ? 'exception' : 'normal'}
            strokeColor={getRiskColor(riskScores.overallRisk)}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Transaction Risk"
            value={riskScores.transactionRisk}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(riskScores.transactionRisk)
            }}
          />
          <Progress 
            percent={riskScores.transactionRisk}
            status={riskScores.transactionRisk > 70 ? 'exception' : 'normal'}
            strokeColor={getRiskColor(riskScores.transactionRisk)}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Entity Risk"
            value={riskScores.entityRisk}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(riskScores.entityRisk)
            }}
          />
          <Progress 
            percent={riskScores.entityRisk}
            status={riskScores.entityRisk > 70 ? 'exception' : 'normal'}
            strokeColor={getRiskColor(riskScores.entityRisk)}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Jurisdiction Risk"
            value={riskScores.jurisdictionRisk}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(riskScores.jurisdictionRisk)
            }}
          />
          <Progress 
            percent={riskScores.jurisdictionRisk}
            status={riskScores.jurisdictionRisk > 70 ? 'exception' : 'normal'}
            strokeColor={getRiskColor(riskScores.jurisdictionRisk)}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default RiskStatsCards; 