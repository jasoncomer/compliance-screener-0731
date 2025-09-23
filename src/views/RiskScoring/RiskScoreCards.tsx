import React, { useMemo } from 'react';

import { Card, Col, Progress,Row, Statistic } from 'antd';

import { RiskScoringResponse } from '../../typings/riskScoring';

interface RiskScoreCardsProps {
  riskScores: RiskScoringResponse;
  getRiskColor: (score: number) => string;
}

type ProgressStatus = 'normal' | 'exception' | 'active' | 'success';

const RiskScoreCards: React.FC<RiskScoreCardsProps> = ({ riskScores, getRiskColor }) => {
  const overallRiskScore = useMemo(() => Math.round(riskScores.overallRisk * 100) || 0, [riskScores.overallRisk]);
  const transactionRiskScore = useMemo(() => Math.round(riskScores.transactionRisk.aggregateScore * 100) || 0, [riskScores.transactionRisk.aggregateScore]);
  const entityRiskScore = useMemo(() => Math.round(riskScores.entityRisk.aggregateScore * 100) || 0, [riskScores.entityRisk.aggregateScore]);
  const jurisdictionRiskScore = useMemo(() => Math.round(riskScores.jurisdictionRisk.aggregateScore * 100) || 0, [riskScores.jurisdictionRisk.aggregateScore]);

  const riskColors = useMemo(() => ({
    overall: getRiskColor(overallRiskScore),
    transaction: getRiskColor(transactionRiskScore),
    entity: getRiskColor(entityRiskScore),
    jurisdiction: getRiskColor(jurisdictionRiskScore),
  }), [overallRiskScore, transactionRiskScore, entityRiskScore, jurisdictionRiskScore, getRiskColor]);

  const riskStatuses = useMemo(() => ({
    overall: (overallRiskScore > 70 ? 'exception' : 'normal') as ProgressStatus,
    transaction: (transactionRiskScore > 70 ? 'exception' : 'normal') as ProgressStatus,
    entity: (entityRiskScore > 70 ? 'exception' : 'normal') as ProgressStatus,
    jurisdiction: (jurisdictionRiskScore > 70 ? 'exception' : 'normal') as ProgressStatus,
  }), [overallRiskScore, transactionRiskScore, entityRiskScore, jurisdictionRiskScore]);

  // Custom formatter to ensure percentage is always visible
  const formatPercent = (percent?: number) => {
    if (percent === undefined) return '0%';
    return `${percent}%`;
  };

  return (
    <Row gutter={[16, 16]} style={{ width: '100%' }}>
      <Col span={6}>
        <Card style={{ width: '100%' }}>
          <Statistic
            title="Overall Risk Score"
            value={overallRiskScore}
            suffix="/100"
            valueStyle={{
              color: riskColors.overall
            }}
          />
          <Progress 
            percent={overallRiskScore}
            status={riskStatuses.overall}
            strokeColor={riskColors.overall}
            format={formatPercent}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card style={{ width: '100%' }}>
          <Statistic
            title="Transaction Risk"
            value={transactionRiskScore}
            suffix="/100"
            valueStyle={{
              color: riskColors.transaction
            }}
          />
          <Progress 
            percent={transactionRiskScore}
            status={riskStatuses.transaction}
            strokeColor={riskColors.transaction}
            format={formatPercent}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card style={{ width: '100%' }}>
          <Statistic
            title="Entity Risk"
            value={entityRiskScore}
            suffix="/100"
            valueStyle={{
              color: riskColors.entity
            }}
          />
          <Progress 
            percent={entityRiskScore}
            status={riskStatuses.entity}
            strokeColor={riskColors.entity}
            format={formatPercent}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card style={{ width: '100%' }}>
          <Statistic
            title="Jurisdiction Risk"
            value={jurisdictionRiskScore}
            suffix="/100"
            valueStyle={{
              color: riskColors.jurisdiction
            }}
          />
          <Progress 
            percent={jurisdictionRiskScore}
            status={riskStatuses.jurisdiction}
            strokeColor={riskColors.jurisdiction}
            format={formatPercent}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default RiskScoreCards; 