import React, { useState } from 'react';
import { Typography, Alert, Spin } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { RiskScores } from './types';
import SearchBar from './SearchBar';
import RiskStatsCards from './RiskStatsCards';
import RiskDetailsTable from './RiskDetailsTable';

const { Title, Paragraph } = Typography;

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
      // TODO: Integrate with backend API
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      const mockScores: RiskScores = {
        transactionRisk: 75,
        entityRisk: 45,
        jurisdictionRisk: 60,
        overallRisk: 60,
        details: {
          transaction: [
            { factor: 'High-value transfers', score: 85, description: 'Multiple transfers exceeding $100,000', severity: 'high' },
            { factor: 'Transaction frequency', score: 65, description: 'Above average transaction frequency', severity: 'medium' },
            { factor: 'Age of wallet', score: 30, description: 'Wallet active for more than 1 year', severity: 'low' },
          ],
          entity: [
            { factor: 'Known entity', score: 40, description: 'Entity identified as legitimate business', severity: 'low' },
            { factor: 'Entity type', score: 50, description: 'Registered as cryptocurrency exchange', severity: 'medium' },
          ],
          jurisdiction: [
            { factor: 'Geographic location', score: 70, description: 'Operations in high-risk jurisdiction', severity: 'high' },
            { factor: 'Regulatory compliance', score: 45, description: 'Partial compliance with regulations', severity: 'medium' },
          ],
        },
        historicalData: [
          { date: '2024-01', overallRisk: 55 },
          { date: '2024-02', overallRisk: 58 },
          { date: '2024-03', overallRisk: 60 },
        ],
        entityInfo: {
          proper_name: 'Crypto Exchange X',
          entity_id: 'CEX001',
          entity_type: 'Cryptocurrency Exchange',
          logo: 'https://example.com/logo.png',
          url: 'www.cryptoexchangex.com',
          ceo: 'John Doe',
          key_personnel: 'Jane Smith, Bob Johnson, Alice Williams',
          contact_email: 'contact@cryptoexchangex.com',
          contact_phone: '+1 (555) 123-4567',
          contact_address: '123 Blockchain Street, Crypto City, CC 12345',
          contact_twitter: '@CryptoExchangeX',
          contact_telegram: '@CryptoXSupport',
          year_founded: '2018',
          description_merged: 'Crypto Exchange X is a leading cryptocurrency exchange platform offering secure trading services with advanced features for both retail and institutional clients.',
          social_media_profiles: [
            'github.com/cryptoexchangex',
            'linkedin.com/company/cryptoexchangex'
          ],
          entity_tags: ['Exchange', 'Trading Platform', 'DeFi'],
          associated_countries: ['United States', 'Singapore', 'United Kingdom'],
          kyc_req: true,
          centralized: true,
          dead: false
        }
      };
      setRiskScores(mockScores);
    } catch (err) {
      setError('Failed to fetch risk scores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <SafetyOutlined /> Risk Scoring Dashboard
      </Title>
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
          <RiskStatsCards riskScores={riskScores} />
          <RiskDetailsTable riskScores={riskScores} />
        </>
      )}
    </div>
  );
};

export default RiskScoring; 