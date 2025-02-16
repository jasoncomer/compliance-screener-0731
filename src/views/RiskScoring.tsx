import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Progress, Alert } from 'antd';
import { calculateRiskScore } from '../api/riskScoring';
import { RiskScores } from '../types/newRiskScoring'
import RiskDetailsTable from './RiskScoring/RiskDetailsTable';
import SearchBar from './RiskScoring/SearchBar';
import Paragraph from 'antd/es/typography/Paragraph';


const RiskScoring: React.FC = () => {
  const [address, setAddress] = useState('');
  const [riskScores, setRiskScores] = useState<RiskScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddressSubmit = async () => {
    if (!address) {
      setError('Please enter a blockchain address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scores = await calculateRiskScore(address, 'address');
      setRiskScores(scores);
    } catch (err) {
      setError('Failed to fetch risk scores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return '#cf1322';
    if (score > 40) return '#faad14';
    return '#3f8600';
  };

  return (
    <div style={{ padding: '24px' }}>
      <SearchBar
        address={address}
        loading={loading}
        onAddressChange={setAddress}
        onSubmit={handleAddressSubmit}
      />

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: '20px' }}>Analyzing blockchain address...</Paragraph>
        </div>
      )}

      {riskScores && !loading && (
        <>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Overall Risk Score"
                  value={riskScores.overallRisk || 0}
                  suffix="/100"
                  valueStyle={{
                    color: getRiskColor(riskScores.overallRisk || 0)
                  }}
                />
                <Progress 
                  percent={riskScores.overallRisk || 0} 
                  status={(riskScores.overallRisk || 0) > 70 ? 'exception' : 'normal'}
                  strokeColor={getRiskColor(riskScores.overallRisk || 0)}
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
                  value={riskScores.jurisdictionRisk || 0}
                  suffix="/100"
                  valueStyle={{
                    color: getRiskColor(riskScores.jurisdictionRisk || 0)
                  }}
                />
                <Progress 
                  percent={riskScores.jurisdictionRisk || 0}
                  status={(riskScores.jurisdictionRisk || 0) > 70 ? 'exception' : 'normal'}
                  strokeColor={getRiskColor(riskScores.jurisdictionRisk || 0)}
                />
              </Card>
            </Col>
          </Row>

          <RiskDetailsTable riskScores={riskScores} />
        </>
      )}
    </div>
  );
};

export default RiskScoring; 