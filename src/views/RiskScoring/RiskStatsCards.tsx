import React from 'react';

import { Card, Col, Progress,Row, Statistic } from 'antd';

import { RiskScoringResponse } from '../../typings/riskScoring';

import { getRiskColor } from './utils';

interface RiskStatsCardsProps {
  riskScores: RiskScoringResponse;
}

const RiskStatsCards: React.FC<RiskStatsCardsProps> = ({ riskScores }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col span={6}>
        <Card>
          <Statistic
            title="Overall Risk Score"
            value={riskScores.overallRisk * 100}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(riskScores.overallRisk)
            }}
          />
          <Progress 
            percent={riskScores.overallRisk * 100} 
            status={riskScores.overallRisk * 100 > 70 ? 'exception' : 'normal'}
            strokeColor={getRiskColor(riskScores.overallRisk)}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Transaction Risk"
            value={riskScores.transactionRisk.aggregateScore * 100}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(riskScores.transactionRisk.aggregateScore)
            }}
          />
          <Progress 
            percent={riskScores.transactionRisk.aggregateScore * 100}
            status={riskScores.transactionRisk.aggregateScore * 100 > 70 ? 'exception' : 'normal'}
            strokeColor={getRiskColor(riskScores.transactionRisk.aggregateScore)}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Entity Risk"
            value={riskScores.entityRisk.aggregateScore * 100}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(riskScores.entityRisk.aggregateScore)
            }}
          />
          <Progress 
            percent={riskScores.entityRisk.aggregateScore * 100}
            status={riskScores.entityRisk.aggregateScore * 100 > 70 ? 'exception' : 'normal'}
            strokeColor={getRiskColor(riskScores.entityRisk.aggregateScore)}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Jurisdiction Risk"
            value={riskScores.jurisdictionRisk.aggregateScore * 100}
            suffix="/100"
            valueStyle={{
              color: getRiskColor(riskScores.jurisdictionRisk.aggregateScore)
            }}
          />
          <Progress 
            percent={riskScores.jurisdictionRisk.aggregateScore * 100}
            status={riskScores.jurisdictionRisk.aggregateScore * 100 > 70 ? 'exception' : 'normal'}
            strokeColor={getRiskColor(riskScores.jurisdictionRisk.aggregateScore)}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default RiskStatsCards; 