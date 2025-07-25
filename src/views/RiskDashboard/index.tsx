import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import EmptyState from '../../components/common/EmptyState';
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
import SocialMediaFeed from './components/entity-intelligence/SocialMediaFeed';
import { AddressSummary } from './components/AddressSummary';
import AddressHeader from './components/address/AddressHeader';
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

const RiskDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [address, setAddress] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [riskScoreModalVisible, setRiskScoreModalVisible] = useState(false);
  const [entityDetailsHeight, setEntityDetailsHeight] = useState<number | undefined>(undefined);
  const entityDetailsRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const handleResize = useCallback(() => {
    if (entityDetailsRef.current) {
      const newHeight = entityDetailsRef.current.offsetHeight;
      setEntityDetailsHeight(prev => (prev !== newHeight ? newHeight : prev));
    }
  }, []);

  // React Query hooks
  const { data: counterpartyTransactionData, isLoading: isLoadingTransactions, error: transactionError } = useAddressTransactions(address, 1, 100); // For counterparty analysis
  const { data: addressSummaryData, isLoading: isLoadingAddressSummary } = useAddressSummary(address);
  const { data: addressBlockStatsData, isLoading: isLoadingAddressBlockStats } = useAddressBlockStats(address);
  const { isLoading: isLoadingAddress, error: addressError } = useAddress(address);
  const { getPrice } = useCryptoPrices();
  const { riskScore, isLoading: isLoadingRiskScore, error: riskScoreError } = useRiskScore(address);
  const btcPrice = getPrice('BTC') || 35000; // Default fallback price

  // Attribution and SOT data hooks
  const { fetchAttributions, attributions } = useAttribution();
  const { itemsMap } = useAppSelector((state: RootState) => state.sot);
  const dispatch = useAppDispatch();

  // Loading state
  const isLoadingAnyData = isLoadingTransactions || isLoadingAddressSummary || isLoadingAddressBlockStats || isLoadingAddress || isLoadingRiskScore;

  // Debug logging
  console.log('RiskDashboard - Debug Info:', {
    address,
    hasData,
    shouldShowData: hasData || (address && !isLoadingAnyData && (counterpartyTransactionData || addressSummaryData || addressBlockStatsData)),
    transactionData: counterpartyTransactionData ? { txsCount: counterpartyTransactionData.txs?.length, pagination: counterpartyTransactionData.pagination } : null,
    isLoadingAnyData,
    isLoadingTransactions,
    transactionError
  });

  // Transform transaction data for counterparty analysis
  const transformedTransactions: TransformedTransaction[] = React.useMemo(() => {
    if (!counterpartyTransactionData?.txs) return [];
    const transformed = transformBtcTransactions(counterpartyTransactionData.txs, address, btcPrice);
    console.log('RiskDashboard - FIRST RAW TX:', counterpartyTransactionData.txs[0]);
    console.log('RiskDashboard - ALL RAW TX COUNT:', counterpartyTransactionData.txs.length);
    console.log('RiskDashboard - TRANSFORMED:', transformed);
    return transformed;
  }, [counterpartyTransactionData?.txs, address, btcPrice]);

  // Function to get entity display name
  const getEntityDisplayName = React.useCallback((entityId: string) => {
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.proper_name || entityId;
  }, [itemsMap]);

  // Function to truncate addresses for display
  const truncateAddress = (address: string, startLength: number = 6, endLength: number = 4) => {
    if (address.length <= startLength + endLength + 3) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
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
        const entityName = entityId ? getEntityDisplayName(entityId) : truncateAddress(address);
        
        return {
          entity: entityName,
          direction: 'inflow' as const,
          amount: `$${(data.totalAmount * btcPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          btcAmount: `${data.totalAmount.toFixed(8)} BTC`,
          txns: data.count,
          address: address
        };
      })
      .sort((a, b) => {
        const aAmount = parseFloat(a.amount.replace(/[$,]/g, ''));
        const bAmount = parseFloat(b.amount.replace(/[$,]/g, ''));
        return bAmount - aAmount;
      })
      .slice(0, 5);

    const outgoingCounterparties = Object.entries(outgoingByAddress)
      .map(([address, data]) => {
        const entityId = attributions[address]?.entity || attributions[address]?.bo || attributions[address]?.custodian;
        const entityName = entityId ? getEntityDisplayName(entityId) : truncateAddress(address);
        
        return {
          entity: entityName,
          direction: 'outflow' as const,
          amount: `$${(data.totalAmount * btcPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          btcAmount: `${data.totalAmount.toFixed(8)} BTC`,
          txns: data.count,
          address: address
        };
      })
      .sort((a, b) => {
        const aAmount = parseFloat(a.amount.replace(/[$,]/g, ''));
        const bAmount = parseFloat(b.amount.replace(/[$,]/g, ''));
        return bAmount - aAmount;
      })
      .slice(0, 5);

    return { incoming: incomingCounterparties, outgoing: outgoingCounterparties };
  }, [transformedTransactions, attributions, btcPrice, getEntityDisplayName]);

  // Prepare address summary data for the component
  const addressSummaryProps = React.useMemo(() => {
    if (!addressSummaryData || !addressBlockStatsData) {
      return {
        totalTransactions: 0,
        totalVolume: 0,
        firstSeen: '',
        lastSeen: '',
        averageTransactionSize: 0,
        inputAmount: 0,
        outputAmount: 0,
        balance: 0,
        topCounterparty: 'N/A',
        isLoading: isLoadingAddressSummary || isLoadingAddressBlockStats
      };
    }

    const totalTxns = counterpartyTransactionData?.pagination?.totalTxs || 0;
    const totalVolume = addressSummaryData.total_received || 0;
    const firstSeen = addressBlockStatsData.firstBlock?.blockNumber?.toString() || '';
    const lastSeen = addressBlockStatsData.lastBlock?.blockNumber?.toString() || '';
    const avgTxSize = totalTxns > 0 ? totalVolume / totalTxns : 0;

    // Calculate input, output, and balance from transaction data
    let inputAmount = 0;
    let outputAmount = 0;
    let topCounterparty = 'N/A';

    if (transformedTransactions.length > 0) {
      // Calculate input and output amounts
      transformedTransactions.forEach(tx => {
        if (tx.type === 'in') {
          inputAmount += tx.value;
        } else if (tx.type === 'out') {
          outputAmount += tx.value;
        }
      });

      // Find top counterparty (highest transaction volume)
      const counterpartyVolumes: { [key: string]: number } = {};
      const counterpartyCounts: { [key: string]: number } = {};
      transformedTransactions.forEach(tx => {
        const counterparty = tx.type === 'in' ? tx.from : tx.to;
        if (counterparty && counterparty !== 'Unknown') {
          counterpartyVolumes[counterparty] = (counterpartyVolumes[counterparty] || 0) + tx.value;
          counterpartyCounts[counterparty] = (counterpartyCounts[counterparty] || 0) + 1;
        }
      });

      const topCounterpartyAddress = Object.entries(counterpartyCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0];

      if (topCounterpartyAddress) {
        const entityId = attributions[topCounterpartyAddress]?.entity || 
                        attributions[topCounterpartyAddress]?.bo || 
                        attributions[topCounterpartyAddress]?.custodian;
        topCounterparty = entityId ? getEntityDisplayName(entityId) : topCounterpartyAddress;
      }
    }

    // Calculate balance (input - output)
    const balance = inputAmount - outputAmount;

    return {
      totalTransactions: totalTxns,
      totalVolume: totalVolume, // Keep in BTC
      firstSeen,
      lastSeen,
      averageTransactionSize: avgTxSize, // Keep in BTC
      inputAmount: inputAmount, // Keep in BTC
      outputAmount: outputAmount, // Keep in BTC
      balance: balance, // Keep in BTC
      topCounterparty,
      isLoading: isLoadingAddressSummary || isLoadingAddressBlockStats
    };
  }, [addressSummaryData, addressBlockStatsData, counterpartyTransactionData, btcPrice, isLoadingAddressSummary, isLoadingAddressBlockStats, transformedTransactions, attributions, getEntityDisplayName]);

  // Get primary entity from address
  const getEntityFromAddress = () => {
    const attribution = attributions[address];
    return attribution?.entity || attribution?.bo || attribution?.custodian;
  };

  // Get Twitter handle for the entity (no longer used - replaced by SocialMediaFeed)
  // const getTwitterHandle = () => {
  //   const entityId = getEntityFromAddress();
  //   if (!entityId) return '';
  //   const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
  //   return entity?.contact_twitter || '';
  // };

  // Entity helper functions
  const getEntityType = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.entity_type ? getEntityTypeLabel(entity.entity_type as EEntityType) : 'Unknown';
  };

  const getEntityLogo = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.logo || '';
  };

  const getEntityDescription = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.description_merged || 'No description available';
  };

  const getEntityWebsite = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.url || '';
  };

  const getEntityPhone = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.contact_phone || '';
  };

  const getEntityAddress = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.contact_address || '';
  };

  const getEntityFounded = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.year_founded ? parseInt(entity.year_founded) : 0;
  };

  const getEntityCountries = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    if (!entity) return [];
    
    const countries = [];
    for (let i = 1; i <= 6; i++) {
      const country = entity[`associate_country_${i}` as keyof typeof entity];
      if (country && typeof country === 'string' && country.trim() !== '') {
        countries.push(country);
      }
    }
    return countries;
  };

  const getEntityTags = (entityId: string): string[] => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    if (!entity) return [];
    
    // Combine all entity tag fields
    const tags: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const tag = entity[`entity_tag${i}` as keyof typeof entity];
      if (tag && typeof tag === 'string') {
        tags.push(tag);
      }
    }
    return tags;
  };

  // Additional entity helper functions
  const getEntityEmail = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.contact_email || '';
  };

  const getEntityTwitter = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.contact_twitter || '';
  };

  const getEntityTelegram = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.contact_telegram || '';
  };

  const getEntityEnsAddress = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.ens_address || '';
  };

  const getEntityLegalInfoUrl = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.legal_info_url || '';
  };

  const getEntityCeo = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.ceo || '';
  };

  const getEntityKeyPersonnel = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.key_personnel || '';
  };

  const getEntityTicker = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.ticker || '';
  };

  const getEntityParentId = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.parent_id || '';
  };

  const getEntitySocialMediaProfiles = (entityId: string): string[] => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    if (!entity) return [];
    
    const profiles: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const profile = entity[`social_media_profile${i === 1 ? '' : '_' + i}` as keyof typeof entity];
      if (profile && typeof profile === 'string' && profile.trim() !== '') {
        profiles.push(profile);
      }
    }
    return profiles;
  };

  const getEntityIsCentralized = (entityId: string): boolean | undefined => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.centralized ?? undefined;
  };

  const getEntityNoKycRequired = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.no_kyc_req || false;
  };

  const getEntityIsDead = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.dead || false;
  };

  const getEntityIsOfacSanctioned = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.ofac || false;
  };

  const getEntityNote = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.note || '';
  };

  const getEntityLastUpdated = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.date_updated || '';
  };

  const getEntityLastModifiedBy = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.user || '';
  };

  const getEntityRevisitSite = (entityId: string) => {
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.revisit_site || false;
  };

  // Risk level helper functions
  const getRiskLevel = (score: number): string => {
    if (score >= 80) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  };

  const getRiskDescription = (score: number): string => {
    if (score >= 80) {
      return 'This address shows significant risk indicators including high transaction volumes, connections to known risky entities, and unusual activity patterns.';
    } else if (score >= 50) {
      return 'This address displays moderate risk factors with some concerning transaction patterns and entity connections that warrant attention.';
    } else if (score >= 20) {
      return 'This address shows low risk indicators with mostly normal transaction patterns and few concerning connections.';
    } else {
      return 'This address appears to be low risk with normal transaction patterns and no significant concerning indicators.';
    }
  };

  // Generate transaction activity data from real transaction data
  const transactionActivityData = React.useMemo(() => {
    if (!transformedTransactions.length) {
      return Array.from({ length: 365 }, (_, i) => ({
        day: i % 7,
        week: Math.floor(i / 7),
        active: false
      }));
    }

    // Create a map of dates to transaction counts
    const dateMap = new Map<string, number>();
    const now = new Date();
    
    // Initialize all dates in the last year with 0 transactions
    for (let i = 0; i < 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dateMap.set(dateKey, 0);
    }

    // Count transactions per day
    transformedTransactions.forEach(tx => {
      const txDate = new Date(tx.time);
      const dateKey = txDate.toISOString().split('T')[0];
      if (dateMap.has(dateKey)) {
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    });

    // Convert to the expected format
    return Array.from({ length: 365 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const txCount = dateMap.get(dateKey) || 0;
      
      return {
        day: date.getDay(),
        week: Math.floor(i / 7),
        active: txCount > 0
      };
    }).reverse(); // Reverse to show oldest to newest
  }, [transformedTransactions]);

  // Get primary entity and tags
  const primaryEntityId = getEntityFromAddress();
  const entityTags = primaryEntityId ? getEntityTags(primaryEntityId) : [];

  useEffect(() => {
    if (!entityDetailsRef.current) return;
    handleResize();
    resizeObserverRef.current = new (window as any).ResizeObserver(handleResize);
    resizeObserverRef.current!.observe(entityDetailsRef.current);
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [primaryEntityId, handleResize]);

  // Generate funds flow data from real transaction data
  const fundsFlowData = React.useMemo(() => {
    if (!transformedTransactions.length) {
      return { incoming: [], outgoing: [] };
    }

    // Group transactions by entity type
    const incomingByEntity: { [key: string]: number } = {};
    const outgoingByEntity: { [key: string]: number } = {};

    transformedTransactions.forEach(tx => {
      if (tx.type === 'in' && tx.from !== 'Unknown') {
        const entityId = attributions[tx.from]?.entity || attributions[tx.from]?.bo || attributions[tx.from]?.custodian;
        const entityName = entityId ? getEntityDisplayName(entityId) : tx.from;
        
        if (!incomingByEntity[entityName]) {
          incomingByEntity[entityName] = 0;
        }
        incomingByEntity[entityName] += tx.value * btcPrice;
      } else if (tx.type === 'out' && tx.to !== 'Unknown') {
        const entityId = attributions[tx.to]?.entity || attributions[tx.to]?.bo || attributions[tx.to]?.custodian;
        const entityName = entityId ? getEntityDisplayName(entityId) : tx.to;
        
        if (!outgoingByEntity[entityName]) {
          outgoingByEntity[entityName] = 0;
        }
        outgoingByEntity[entityName] += tx.value * btcPrice;
      }
    });

    // Convert to the expected format
    const incomingData = Object.entries(incomingByEntity)
      .map(([name, value]) => ({
        name,
        value,
        entityType: 'Exchange' // Default to Exchange for now
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const outgoingData = Object.entries(outgoingByEntity)
      .map(([name, value]) => ({
        name,
        value,
        entityType: 'Wallet' // Default to Wallet for outgoing
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { incoming: incomingData, outgoing: outgoingData };
  }, [transformedTransactions, attributions, btcPrice, getEntityDisplayName]);

  // Check if we have data to display (only when hasData is true)
  const shouldShowData = hasData && address && !isLoadingAnyData && (counterpartyTransactionData || addressSummaryData || addressBlockStatsData);

  // Handle address search
  const handleAddressSearch = async (value: string) => {
    if (!value.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await fetchAttributions([value]);
      await dispatch(fetchSOT());
      setAddress(value);
      setSearchValue(value);
      setHasData(true);
    } catch (err) {
      setError('Failed to fetch address data');
      console.error('Error fetching address data:', err);
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
      handleAddressSearch(address);
    }
  };

  return (
    <ViewWrapper
      icon={<BarChart3 className="w-8 h-8 text-orange-500" />}
      title="Risk Dashboard"
      fullWidth={true}
    >
      {/* Search Bar */}
      <div className="mb-6 max-w-2xl">
        <SearchInput
          placeholder="Enter blockchain address (e.g., 0x1234... or bc1qxy2...)"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={handleSearch}
          loading={loading}
          disabled={loading}
        />
      </div>

      {/* Welcome Message - Show when no search has been performed and no data available */}
      {!shouldShowData && !loading && !isLoadingAnyData && (
        <EmptyState
          variant="initial"
          icon={<BarChart3 className="w-12 h-12" />}
          title="Welcome to Risk Dashboard"
          description="Analyze blockchain addresses for risk assessment, transaction patterns, and entity intelligence. Get comprehensive insights into address behavior, counterparty analysis, and risk scoring."
        />
      )}

      {shouldShowData && !loading && !isLoadingAnyData && (
        <div className="space-y-6">
          {/* Address Header - Full Width */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <AddressHeader 
              address={address}
              entityTags={entityTags}
            />
          </div>

          {/* Summary Stats and Risk Assessment - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AddressSummary {...addressSummaryProps} />
            <RiskAssessment 
              score={riskScore ? Math.round(riskScore.overallRisk * 100) : 0}
              level={riskScore ? getRiskLevel(riskScore.overallRisk * 100) : 'Unknown'}
              description={riskScore ? getRiskDescription(riskScore.overallRisk * 100) : 'No risk data available'}
              isLoading={isLoadingRiskScore || loading}
              onSeeDetails={handleRiskScoreClick}
            />
          </div>

          {/* Transaction Activity - Full Width */}
          {transformedTransactions.length > 0 && (
       
              <TransactionActivity transactionActivity={transactionActivityData} />
        
          )}

          {/* Top Counterparties and Transaction History - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <TopCounterparties 
                incoming={counterpartyData.incoming} 
                outgoing={counterpartyData.outgoing} 
                onCounterpartyClick={handleCounterpartyClick}
                transactions={transformedTransactions}
              />
            </div>
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <TransactionHistory 
                address={address}
              />
            </div>
          </div>

          {/* Funds Flow Analysis - Full Width */}
          {(fundsFlowData.incoming.length > 0 || fundsFlowData.outgoing.length > 0) && (
       
              <CombinedFundsFlow 
                incomingData={fundsFlowData.incoming}
                outgoingData={fundsFlowData.outgoing}
              />
          )}

          {/* Entity Details and Twitter Timeline - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div ref={entityDetailsRef} className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <EntityDetails 
                name={primaryEntityId ? getEntityDisplayName(primaryEntityId) : "Unknown Entity"}
                type={primaryEntityId ? getEntityType(primaryEntityId) : "Unknown"}
                description={primaryEntityId ? getEntityDescription(primaryEntityId) : "No description available"}
                website={primaryEntityId ? getEntityWebsite(primaryEntityId) : ""}
                phone={primaryEntityId ? getEntityPhone(primaryEntityId) : ""}
                address={primaryEntityId ? getEntityAddress(primaryEntityId) : ""}
                founded={primaryEntityId ? getEntityFounded(primaryEntityId) : 0}
                logo={primaryEntityId ? getEntityLogo(primaryEntityId) || "" : ""}
                countries={primaryEntityId ? getEntityCountries(primaryEntityId) : []}
                entityId={primaryEntityId || ""}
                email={primaryEntityId ? getEntityEmail(primaryEntityId) : ""}
                twitter={primaryEntityId ? getEntityTwitter(primaryEntityId) : ""}
                telegram={primaryEntityId ? getEntityTelegram(primaryEntityId) : ""}
                ensAddress={primaryEntityId ? getEntityEnsAddress(primaryEntityId) : ""}
                legalInfoUrl={primaryEntityId ? getEntityLegalInfoUrl(primaryEntityId) : ""}
                ceo={primaryEntityId ? getEntityCeo(primaryEntityId) : ""}
                keyPersonnel={primaryEntityId ? getEntityKeyPersonnel(primaryEntityId) : ""}
                ticker={primaryEntityId ? getEntityTicker(primaryEntityId) : ""}
                parentId={primaryEntityId ? getEntityParentId(primaryEntityId) : ""}
                entityTags={primaryEntityId ? getEntityTags(primaryEntityId) : []}
                socialMediaProfiles={primaryEntityId ? getEntitySocialMediaProfiles(primaryEntityId) : []}
                isCentralized={primaryEntityId ? getEntityIsCentralized(primaryEntityId) : undefined}
                noKycRequired={primaryEntityId ? getEntityNoKycRequired(primaryEntityId) : false}
                isDead={primaryEntityId ? getEntityIsDead(primaryEntityId) : false}
                isOfacSanctioned={primaryEntityId ? getEntityIsOfacSanctioned(primaryEntityId) : false}
                note={primaryEntityId ? getEntityNote(primaryEntityId) : ""}
                lastUpdated={primaryEntityId ? getEntityLastUpdated(primaryEntityId) : ""}
                lastModifiedBy={primaryEntityId ? getEntityLastModifiedBy(primaryEntityId) : ""}
                revisitSite={primaryEntityId ? getEntityRevisitSite(primaryEntityId) : false}
              />
            </div>
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" style={entityDetailsHeight ? { height: entityDetailsHeight } : {}}>
              <SocialMediaFeed 
                address={address}
                title="Social Media & News Feed"
              />
            </div>
          </div>
        </div>
      )}

      {(loading || isLoadingAnyData) && (
        <div className="space-y-6">
          {/* Address Header Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>

          {/* Summary Stats and Risk Assessment Skeleton - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-26"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Transaction Activity Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-4"></div>
              <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>

          {/* Top Counterparties and Transaction History Skeleton - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-36 mb-4"></div>
                <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
                <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Funds Flow Analysis Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-36 mb-4"></div>
              <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>

          {/* Entity Details and Twitter Timeline Skeleton - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-4"></div>
                <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
          </div>
          
          {/* Loading indicator */}
          <div className="text-center py-5 mt-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-primary" />
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Analyzing blockchain address and gathering risk intelligence...
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {riskScoreError && (
        <div className="mb-4 p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Risk Score Error</span>
          </div>
          <p className="mt-1">{riskScoreError}</p>
        </div>
      )}

      {addressError && (
        <div className="mb-4 p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Address Error</span>
          </div>
          <p className="mt-1">{addressError.message}</p>
        </div>
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
