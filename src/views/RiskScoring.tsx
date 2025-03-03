import React, { useState } from 'react';
import { Spin, Alert } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { colors } from '../styles/variables';
import { calculateRiskScore } from '../api/riskScoring';
import { RiskScoringResponse } from '../types/riskScoring';
import ViewWrapper from '../components/ViewWrapper';
import RiskDetailsTable from './RiskScoring/RiskDetailsTable';
import SearchBar from './RiskScoring/SearchBar';
import RiskScoreCards from './RiskScoring/RiskScoreCards';
import Paragraph from 'antd/es/typography/Paragraph';

const RiskScoring: React.FC = () => {
  const [address, setAddress] = useState('');
  const [riskScores, setRiskScores] = useState<RiskScoringResponse | null>(null);
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
    if (score > 70) return colors.danger;
    if (score > 40) return colors.warning;
    return colors.success;
  };

  return (
    <ViewWrapper
      icon={<SafetyOutlined style={{ fontSize: '28px', color: colors.attributionHover, fontWeight: 'bold' }} />}
      title="Risk Scoring Dashboard"
    >
      <Paragraph>
        Analyze the risk profile of any blockchain address based on transaction patterns,
        entity information, and jurisdiction data.
      </Paragraph>

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
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px', flex: '1' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: '20px' }}>Analyzing blockchain address...</Paragraph>
        </div>
      )}

      {riskScores && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <RiskScoreCards riskScores={riskScores} getRiskColor={getRiskColor} />
          <RiskDetailsTable riskScores={riskScores} />
        </div>
      )}
    </ViewWrapper>
  );
};

export default RiskScoring; 