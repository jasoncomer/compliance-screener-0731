import React, { useEffect,useState } from 'react';

import { Alert,Spin } from 'antd';
import Paragraph from 'antd/es/typography/Paragraph';
import { ExternalLink,Shield } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { calculateRiskScore } from '../../api/riskScoring';
import EmptyState from '../../components/common/EmptyState';
import SearchInput from '../../components/common/SearchInput';
import ViewWrapper from '../../components/ViewWrapper';
import { RiskScoringResponse } from '../../typings/riskScoring';

import RiskDetailsTable from './RiskDetailsTable';
import RiskScoreCards from './RiskScoreCards';



const RiskScoring: React.FC = () => {
  const location = useLocation();
  const [address, setAddress] = useState('');
  const [riskScores, setRiskScores] = useState<RiskScoringResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const addressParam = searchParams.get('address');
    if (addressParam) {
      setAddress(addressParam);
      handleAddressSubmit(addressParam);
    }
  }, [location.search]);

  const handleAddressSubmit = async (addr?: string) => {
    const addressToUse = addr || address;
    if (!addressToUse) {
      setError('Please enter a blockchain address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scores = await calculateRiskScore(addressToUse, 'address');
      setRiskScores(scores);
    } catch (err) {
      setError('Failed to fetch risk scores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 70) return 'hsl(var(--danger))';
    if (score > 40) return 'hsl(var(--warning))';
    return 'hsl(var(--success))';
  };

  return (
    <ViewWrapper
      icon={<Shield className="w-8 h-8 text-orange-500" />}
      title="Risk Scoring Dashboard"
      // description="Analyze the risk profile of any blockchain address based on transaction patterns, entity information, and jurisdiction data."
      fullWidth={true}
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-2xl">
            <SearchInput
              placeholder="Enter blockchain address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onSearch={() => handleAddressSubmit()}
              loading={loading}
            />
          </div>
          <button
            onClick={() => handleAddressSubmit()}
            disabled={!address || loading}
            className="px-4 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Risk
          </button>
          <button
            onClick={() => address && window.open(`/home/block-explorer/address/${address}`, '_blank')}
            disabled={!address}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            View in Block Explorer
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

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

        {!loading && !riskScores && !error && (
          <EmptyState
            variant="initial"
            icon={<Shield className="w-12 h-12" />}
            title="Start Risk Analysis"
            description="Analyze the risk profile of any blockchain address based on transaction patterns, entity information, and jurisdiction data."
          />
        )}

        {riskScores && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <RiskScoreCards riskScores={riskScores} getRiskColor={getRiskColor} />
            <RiskDetailsTable riskScores={riskScores} />
          </div>
        )}
      </div>
    </ViewWrapper>
  );
};

export default RiskScoring; 