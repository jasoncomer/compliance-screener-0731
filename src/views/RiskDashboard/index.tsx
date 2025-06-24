import React, { useState } from 'react';
import { Card, Input, Spin, Alert, Typography, Skeleton } from 'antd';
import { SearchOutlined, BarChartOutlined } from '@ant-design/icons';
import { colors } from '../../styles/variables';
import { useTheme } from '../../context/ThemeContext';
import ViewWrapper from '../../components/ViewWrapper';
import { 
  RiskAssessment, 
  TransactionActivity,
  TopCounterparties, 
  TransactionHistory, 
  CombinedFundsFlow,
  EntityDetails,
  RiskScoreModal
} from './components';
import TwitterTimeline from './components/entity-intelligence/TwitterTimeline';
import { AddressSummary } from './components/AddressSummary';
import AddressHeader from './components/address/AddressHeader';
import styled from 'styled-components';
import { useAddressTransactions } from '../../hooks/useAddressTransactions';
import { useAddressSummary } from '../../hooks/useAddressSummary';
import { useAddressBlockStats } from '../../hooks/useAddressBlockStats';
import { useAddress } from '../../hooks/useAddress';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';
import { useRiskScore } from '../../hooks/useRiskScore';
import { transformBtcTransactions, TransformedTransaction } from '../../utils/transactionTransformers';
import { useAttribution } from '../../context/AttributionContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { RootState } from '../../store/store';
import { getEntityTypeLabel } from '../../utils/display-labels';
import { EEntityType } from '../../typings/SOT';
import { fetchSOT } from '../../store/slices/sotSlice';


const { Search } = Input;

// Styled components for height matching
const FlexRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: -8px;
  gap: 16px;
`;

const FlexCol = styled.div`
  padding: 8px;
  display: flex;
  flex: 1;
  min-width: 300px;
  align-items: stretch;
  
  & > * {
    flex: 1;
    margin: 0 !important;
    height: 100% !important;
  }
  
  &.full-width {
    flex-basis: 100%;
    min-width: 100%;
  }
  
  &.half-width {
    flex-basis: calc(50% - 16px);
    min-width: 400px;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 24px;
  
  .ant-input-search {
    .ant-input {
      background: #1f2937;
      border: none;
      box-shadow: none;
      color: #fff;
      border-radius: 8px;
      
      &:hover, &:focus {
        border-color: ${colors.attributionHover};
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      }
      
      &::placeholder {
        color: #9ca3af;
      }
    }
    
    .ant-input-search-button {
      background: ${colors.attributionHover};
      border: 1px solid ${colors.attributionHover};
      border-radius: 8px;
      height: 40px;
      
      &:hover {
        background: #2563eb;
        border-color: #2563eb;
      }
    }
  }
`;

const LoadingContainer = styled.div`
  .ant-skeleton {
    .ant-skeleton-content {
      .ant-skeleton-title {
        background: linear-gradient(90deg, #374151 25%, #4b5563 37%, #374151 63%);
        background-size: 400% 100%;
        animation: ant-skeleton-loading 1.4s ease infinite;
      }
      .ant-skeleton-paragraph {
        li {
          background: linear-gradient(90deg, #374151 25%, #4b5563 37%, #374151 63%);
          background-size: 400% 100%;
          animation: ant-skeleton-loading 1.4s ease infinite;
        }
      }
    }
  }
  
  @keyframes ant-skeleton-loading {
    0% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0 50%;
    }
  }
`;

const LoadingCard = styled(Card)`
  background: #1f2937 !important;
  border: 1px solid #374151 !important;
  border-radius: 16px !important;
  
  .ant-card-body {
    padding: 24px;
  }
`;

const RiskDashboard: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false); // Changed to false to only show searchbar by default
  const [address, setAddress] = useState('bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh');
  const [searchValue, setSearchValue] = useState('');
  const [riskScoreModalVisible, setRiskScoreModalVisible] = useState(false);

  // React Query hooks
  const { data: transactionData, isLoading: isLoadingTransactions, error: transactionError } = useAddressTransactions(address, 1, 100);
  const { data: addressSummaryData, isLoading: isLoadingAddressSummary } = useAddressSummary(address);
  const { data: addressBlockStatsData, isLoading: isLoadingAddressBlockStats } = useAddressBlockStats(address);
  const { data: addressData, isLoading: isLoadingAddress, error: addressError } = useAddress(address);
  const { getPrice } = useCryptoPrices();
  const { riskScore, isLoading: isLoadingRiskScore, error: riskScoreError } = useRiskScore(address);
  const btcPrice = getPrice('BTC') || 35000; // Default fallback price

  // Attribution and SOT data hooks
  const { fetchAttributions, attributions } = useAttribution();
  const { itemsMap } = useAppSelector((state: RootState) => state.sot);
  const dispatch = useAppDispatch();

  // Transform transaction data
  const transformedTransactions: TransformedTransaction[] = React.useMemo(() => {
    if (!transactionData?.txs) return [];
    const transformed = transformBtcTransactions(transactionData.txs, address, btcPrice);
    console.log('RiskDashboard - transformed transactions:', transformed);
    return transformed;
  }, [transactionData?.txs, address, btcPrice]);

  // Function to get entity display name
  const getEntityDisplayName = (entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.proper_name || entityId;
  };

  // Generate counterparty data from transaction history
  const counterpartyData = React.useMemo(() => {
    if (!transformedTransactions.length) {
      return { incoming: [], outgoing: [] };
    }

    // Group transactions by counterparty address
    const incomingByAddress: { [key: string]: { totalAmount: number; count: number; addresses: string[] } } = {};
    const outgoingByAddress: { [key: string]: { totalAmount: number; count: number; addresses: string[] } } = {};

    transformedTransactions.forEach(tx => {
      if (tx.type === 'in' && tx.from !== 'Unknown') {
        if (!incomingByAddress[tx.from]) {
          incomingByAddress[tx.from] = { totalAmount: 0, count: 0, addresses: [] };
        }
        incomingByAddress[tx.from].totalAmount += tx.value;
        incomingByAddress[tx.from].count += 1;
        if (!incomingByAddress[tx.from].addresses.includes(tx.from)) {
          incomingByAddress[tx.from].addresses.push(tx.from);
        }
      } else if (tx.type === 'out' && tx.to !== 'Unknown') {
        if (!outgoingByAddress[tx.to]) {
          outgoingByAddress[tx.to] = { totalAmount: 0, count: 0, addresses: [] };
        }
        outgoingByAddress[tx.to].totalAmount += tx.value;
        outgoingByAddress[tx.to].count += 1;
        if (!outgoingByAddress[tx.to].addresses.includes(tx.to)) {
          outgoingByAddress[tx.to].addresses.push(tx.to);
        }
      }
    });

    // Convert to array and sort by total amount
    const incomingCounterparties = Object.entries(incomingByAddress)
      .map(([address, data]) => {
        const entityId = attributions[address]?.entity || attributions[address]?.bo || attributions[address]?.custodian;
        const entityName = entityId ? getEntityDisplayName(entityId) : 'Unknown Wallet';
        
        return {
          entity: entityName,
          direction: 'inflow' as const,
          amount: `$${(data.totalAmount * btcPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          txns: data.count,
          address: address,
          totalAmount: data.totalAmount * btcPrice // For sorting
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
      .map(({ totalAmount, ...rest }) => rest); // Remove totalAmount from final result

    const outgoingCounterparties = Object.entries(outgoingByAddress)
      .map(([address, data]) => {
        const entityId = attributions[address]?.entity || attributions[address]?.bo || attributions[address]?.custodian;
        const entityName = entityId ? getEntityDisplayName(entityId) : 'Unknown Wallet';
        
        return {
          entity: entityName,
          direction: 'outflow' as const,
          amount: `$${(data.totalAmount * btcPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          txns: data.count,
          address: address,
          totalAmount: data.totalAmount * btcPrice // For sorting
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
      .map(({ totalAmount, ...rest }) => rest); // Remove totalAmount from final result

    return { incoming: incomingCounterparties, outgoing: outgoingCounterparties };
  }, [transformedTransactions, attributions, btcPrice, getEntityDisplayName]);

  // Prepare address summary data for the component
  const addressSummaryProps = React.useMemo(() => {
    if (!addressSummaryData || !addressBlockStatsData || !addressData) {
      return {
        balance: 0,
        total_received: 0,
        total_spent: 0,
        script_type: 'Unknown',
        firstBlock: undefined,
        lastBlock: undefined,
        isLoading: true
      };
    }

    return {
      balance: addressSummaryData.balance || 0,
      total_received: addressSummaryData.total_received || 0,
      total_spent: addressSummaryData.total_spent || 0,
      script_type: addressData.script_type || 'Unknown',
      firstBlock: addressBlockStatsData.firstBlock?.blockNumber,
      lastBlock: addressBlockStatsData.lastBlock?.blockNumber,
      isLoading: false
    };
  }, [addressSummaryData, addressBlockStatsData, addressData]);

  // Check if any data is loading
  const isLoadingAnyData = isLoadingTransactions || isLoadingAddressSummary || isLoadingAddressBlockStats || isLoadingAddress || isLoadingRiskScore;

  // Fetch SOT data when component mounts
  React.useEffect(() => {
    dispatch(fetchSOT());
  }, [dispatch]);

  // Fetch attributions when address changes
  React.useEffect(() => {
    if (address) {
      fetchAttributions([address]);
    }
  }, [address, fetchAttributions]);

  // Function to get entity information from address
  const getEntityFromAddress = () => {
    if (!address || !attributions[address]) return null;
    
    const entityId = attributions[address]?.entity || attributions[address]?.bo || attributions[address]?.custodian;
    if (!entityId) return null;
    
    return Object.values(itemsMap).find(sot => sot.entity_id === entityId);
  };

  // Function to get Twitter handle from entity
  const getTwitterHandle = () => {
    const entity = getEntityFromAddress();
    return entity?.contact_twitter || null;
  };

  // Get Twitter handle for display
  const twitterHandle = getTwitterHandle();

  // Function to get entity type
  const getEntityType = (entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.entity_type ? getEntityTypeLabel(entity.entity_type as EEntityType) : '';
  };

  // Function to get entity logo
  const getEntityLogo = (entityId: string) => {
    if (!entityId) return null;
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.logo;
  };

  // Function to get entity description
  const getEntityDescription = (entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.description_merged || '';
  };

  // Function to get entity website
  const getEntityWebsite = (entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.url || '';
  };

  // Function to get entity phone
  const getEntityPhone = (entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.contact_phone || '';
  };

  // Function to get entity address
  const getEntityAddress = (entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.contact_address || '';
  };

  // Function to get entity founded year
  const getEntityFounded = (entityId: string) => {
    if (!entityId) return 0;
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.year_founded ? parseInt(entity.year_founded) : 0;
  };

  // Function to get entity countries
  const getEntityCountries = (entityId: string) => {
    if (!entityId) return [];
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    const countries = [];
    for (let i = 1; i <= 6; i++) {
      const country = entity?.[`associate_country_${i}` as keyof typeof entity];
      if (country && typeof country === 'string' && country.trim() !== '') {
        countries.push(country);
      }
    }
    return countries;
  };

  // Function to get entity tags (same as block explorer)
  const getEntityTags = (entityId: string): string[] => {
    if (!entityId) return [];
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    // Combine all entity tag fields
    const tags: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const tag = entity?.[`entity_tag${i}` as keyof typeof entity];
      if (tag && typeof tag === 'string') {
        tags.push(tag);
      }
    }
    return tags;
  };

  // Get entity tags for the current address
  const entityTags = React.useMemo(() => {
    if (!address || !attributions[address]) return [];
    const entityId = attributions[address]?.entity || attributions[address]?.bo || attributions[address]?.custodian;
    return getEntityTags(entityId);
  }, [address, attributions, itemsMap]);

  // Get the primary entity ID for the address
  const primaryEntityId = React.useMemo(() => {
    if (!address || !attributions[address]) return null;
    return attributions[address]?.entity || attributions[address]?.bo || attributions[address]?.custodian;
  }, [address, attributions]);

  // Calculate risk level and description based on actual risk score
  const getRiskLevel = (score: number): string => {
    if (score > 70) return 'High';
    if (score > 40) return 'Medium';
    return 'Low';
  };

  const getRiskDescription = (score: number): string => {
    if (score > 70) return 'High risk detected';
    if (score > 40) return 'Moderate risk level';
    return 'Low risk profile';
  };

  // Mock data for TransactionActivity
  const mockTransactionActivity = Array.from({ length: 365 }, (_, i) => ({
    day: i % 7,
    week: Math.floor(i / 7),
    active: Math.random() > 0.7
  }));

  // Mock data for Funds Flow Analysis
  const mockIncomingData = [
    { name: 'Exchange A', value: 50000, entityType: 'Exchange' },
    { name: 'Wallet B', value: 25000, entityType: 'Wallet' },
    { name: 'DeFi Protocol', value: 15000, entityType: 'DeFi' }
  ];

  const mockOutgoingData = [
    { name: 'Exchange C', value: 30000, entityType: 'Exchange' },
    { name: 'Wallet D', value: 20000, entityType: 'Wallet' },
    { name: 'NFT Marketplace', value: 10000, entityType: 'NFT' }
  ];

  const handleAddressSearch = async (value: string) => {
    if (!value.trim()) {
      setError('Please enter a blockchain address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the address which will trigger the useRiskScore hook to fetch new data
      setAddress(value);
      setHasData(true);
      setSearchValue(value);
    } catch (err) {
      setError('Failed to fetch risk data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    handleAddressSearch(value);
  };

  const handleRiskScoreClick = () => {
    setRiskScoreModalVisible(true);
  };

  // Handle counterparty click to navigate to that address
  const handleCounterpartyClick = (address: string) => {
    if (address && address.trim()) {
      setAddress(address);
      setSearchValue(address);
      setHasData(true);
    }
  };

  return (
    <ViewWrapper
      icon={<BarChartOutlined style={{ fontSize: '28px', color: colors.attributionHover }} />}
      title="Risk Dashboard"
      fullWidth={true}
    >
      {/* Search Bar */}
      <SearchContainer>
        <Search
          placeholder="Enter blockchain address (e.g., 0x1234... or bc1qxy2...)"
          enterButton={<SearchOutlined />}
          size="large"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          loading={loading}
          allowClear
        />
      </SearchContainer>

      {/* Welcome Message - Show when no search has been performed */}
      {!hasData && !loading && !isLoadingAnyData && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#9ca3af',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <BarChartOutlined style={{ 
            fontSize: '64px', 
            color: colors.attributionHover, 
            marginBottom: '24px',
            opacity: 0.7
          }} />
          <Typography.Title level={3} style={{ color: '#e5e7eb', marginBottom: '16px' }}>
            Risk Dashboard
          </Typography.Title>
          <Typography.Paragraph style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
            Enter a blockchain address above to analyze its risk profile, transaction patterns, and associated entities.
          </Typography.Paragraph>
          <Typography.Text style={{ fontSize: '14px', opacity: 0.8 }}>
            Supports Bitcoin (bc1q...), Ethereum (0x...), and other major blockchain addresses
          </Typography.Text>
        </div>
      )}

      {hasData && !loading && !isLoadingAnyData && (
        <FlexRow>
          {/* Address Header - Full Width */}
          <FlexCol className="full-width">
            <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl`}>
              <AddressHeader 
                address={address}
                entityTags={entityTags}
              />
            </Card>
          </FlexCol>

          {/* Summary Stats - Half Width Each */}
          <FlexCol className="half-width">
            <AddressSummary {...addressSummaryProps} />
          </FlexCol>
          <FlexCol className="half-width">
            <RiskAssessment 
              score={riskScore ? Math.round(riskScore.overallRisk * 100) : 0}
              level={riskScore ? getRiskLevel(riskScore.overallRisk * 100) : 'Unknown'}
              description={riskScore ? getRiskDescription(riskScore.overallRisk * 100) : 'No risk data available'}
              isLoading={isLoadingRiskScore || loading}
              onSeeDetails={handleRiskScoreClick}
            />
          </FlexCol>

          {/* Transaction Activity - Full Width */}
          <FlexCol className="full-width">
            <TransactionActivity transactionActivity={mockTransactionActivity} />
          </FlexCol>

          {/* Top Counterparties and Transaction History - Half Width Each */}
          <FlexCol className="half-width">
            <TopCounterparties 
              incoming={counterpartyData.incoming} 
              outgoing={counterpartyData.outgoing} 
              onCounterpartyClick={handleCounterpartyClick}
              transactions={transformedTransactions}
            />
          </FlexCol>
          <FlexCol className="half-width">
            <TransactionHistory 
              transactions={transformedTransactions} 
              loading={isLoadingTransactions}
              error={transactionError}
              address={address}
            />
          </FlexCol>

          {/* Funds Flow Analysis - Full Width */}
          <FlexCol className="full-width">
            <CombinedFundsFlow 
              incomingData={mockIncomingData}
              outgoingData={mockOutgoingData}
            />
          </FlexCol>

          {/* Entity Details and Twitter Timeline */}
          <FlexCol className="half-width">
            <EntityDetails 
              name={primaryEntityId ? getEntityDisplayName(primaryEntityId) : "Unknown Entity"}
              type={primaryEntityId ? getEntityType(primaryEntityId) : "Unknown"}
              description={primaryEntityId ? getEntityDescription(primaryEntityId) : "No description available"}
              website={primaryEntityId ? getEntityWebsite(primaryEntityId) : ""}
              contact={primaryEntityId ? getEntityWebsite(primaryEntityId) : ""}
              phone={primaryEntityId ? getEntityPhone(primaryEntityId) : ""}
              address={primaryEntityId ? getEntityAddress(primaryEntityId) : ""}
              founded={primaryEntityId ? getEntityFounded(primaryEntityId) : 0}
              logo={primaryEntityId ? getEntityLogo(primaryEntityId) || "" : ""}
              countries={primaryEntityId ? getEntityCountries(primaryEntityId) : []}
            />
          </FlexCol>
          <FlexCol className="half-width">
            <TwitterTimeline 
              username={twitterHandle}
              title="Twitter Feed"
            />
          </FlexCol>
        </FlexRow>
      )}

      {(loading || isLoadingAnyData) && (
        <LoadingContainer>
          <FlexRow>
            {/* Address Header Skeleton */}
            <FlexCol className="full-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 8 }} />
                <Skeleton.Input active size="large" style={{ width: '100%' }} />
              </LoadingCard>
            </FlexCol>

            {/* Summary Stats Skeletons */}
            <FlexCol className="half-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 16 }} />
                <Skeleton.Input active size="large" style={{ width: '100%' }} />
              </LoadingCard>
            </FlexCol>
            <FlexCol className="half-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 16 }} />
                <Skeleton.Input active size="large" style={{ width: '100%' }} />
              </LoadingCard>
            </FlexCol>

            {/* Transaction Activity Skeleton */}
            <FlexCol className="full-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 150, marginBottom: 16 }} />
                <Skeleton.Input active size="large" style={{ width: '100%', height: 200 }} />
              </LoadingCard>
            </FlexCol>

            {/* Top Counterparties and Transaction History Skeletons */}
            <FlexCol className="half-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 140, marginBottom: 16 }} />
                <Skeleton.Input active size="large" style={{ width: '100%', height: 200 }} />
              </LoadingCard>
            </FlexCol>
            <FlexCol className="half-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 16 }} />
                <Skeleton.Input active size="large" style={{ width: '100%', height: 200 }} />
              </LoadingCard>
            </FlexCol>

            {/* Funds Flow Analysis Skeleton */}
            <FlexCol className="full-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 140, marginBottom: 16 }} />
                <Skeleton.Input active size="large" style={{ width: '100%', height: 200 }} />
              </LoadingCard>
            </FlexCol>

            {/* Entity Details and OSINT Skeletons */}
            <FlexCol className="half-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 16 }} />
                <Skeleton.Input active size="large" style={{ width: '100%', height: 200 }} />
              </LoadingCard>
            </FlexCol>
            <FlexCol className="half-width">
              <LoadingCard>
                <Skeleton.Input active size="small" style={{ width: 80, marginBottom: 16 }} />
                <Skeleton.Input active size="large" style={{ width: '100%', height: 200 }} />
              </LoadingCard>
            </FlexCol>
          </FlexRow>
          
          {/* Loading indicator */}
          <div style={{ textAlign: 'center', padding: '20px', marginTop: '16px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '12px', color: theme === 'light' ? '#6b7280' : '#9ca3af', fontSize: '14px' }}>
              Analyzing blockchain address and gathering risk intelligence...
            </div>
          </div>
        </LoadingContainer>
      )}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {riskScoreError && (
        <Alert
          message="Risk Score Error"
          description={riskScoreError}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {addressError && (
        <Alert
          message="Address Error"
          description={addressError.message}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {riskScoreModalVisible && (
        <RiskScoreModal
          visible={riskScoreModalVisible}
          onClose={() => setRiskScoreModalVisible(false)}
          riskScores={riskScore}
          address={address}
          loading={isLoadingRiskScore}
        />
      )}
    </ViewWrapper>
  );
};

export default RiskDashboard;
