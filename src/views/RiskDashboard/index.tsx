import React, { useState } from 'react';
import { Search, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
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
import { useTheme } from '../../context/ThemeContext';

const RiskDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false); // Changed to false to only show searchbar by default
  const [address, setAddress] = useState('bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh');
  const [searchValue, setSearchValue] = useState('bc1qxy2kgdygjrsqtzqzn0yrf2493p83kkfjhx0wlh');
  const [riskScoreModalVisible, setRiskScoreModalVisible] = useState(false);
  const { theme } = useTheme();

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
        const entityName = entityId ? getEntityDisplayName(entityId) : 'Unknown Wallet';
        
        return {
          entity: entityName,
          direction: 'outflow' as const,
          amount: `$${(data.totalAmount * btcPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
      totalVolume: totalVolume * btcPrice, // Convert to USD
      firstSeen,
      lastSeen,
      averageTransactionSize: avgTxSize * btcPrice, // Convert to USD
      inputAmount: inputAmount * btcPrice, // Convert to USD
      outputAmount: outputAmount * btcPrice, // Convert to USD
      balance: balance * btcPrice, // Convert to USD
      topCounterparty,
      isLoading: isLoadingAddressSummary || isLoadingAddressBlockStats
    };
  }, [addressSummaryData, addressBlockStatsData, counterpartyTransactionData, btcPrice, isLoadingAddressSummary, isLoadingAddressBlockStats, transformedTransactions, attributions, getEntityDisplayName]);

  // Get primary entity from address
  const getEntityFromAddress = () => {
    const attribution = attributions[address];
    return attribution?.entity || attribution?.bo || attribution?.custodian;
  };

  // Get Twitter handle for the entity
  const getTwitterHandle = () => {
    const entityId = getEntityFromAddress();
    if (!entityId) return '';
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    return entity?.contact_twitter || '';
  };

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

  // Mock data for components that need it
  const mockTransactionActivity = Array.from({ length: 365 }, (_, i) => ({
    day: i % 7,
    week: Math.floor(i / 7),
    active: Math.random() > 0.7
  }));

  const mockIncomingData = [
    { name: 'Binance', value: 125000, entityType: 'Exchange' },
    { name: 'Coinbase', value: 89000, entityType: 'Exchange' },
    { name: 'Kraken', value: 45000, entityType: 'Exchange' },
    { name: 'Other', value: 21000, entityType: 'Wallet' }
  ];

  const mockOutgoingData = [
    { name: 'Unknown Wallet', value: 95000, entityType: 'Wallet' },
    { name: 'DeFi Protocol', value: 75000, entityType: 'DeFi' },
    { name: 'Exchange', value: 45000, entityType: 'Exchange' },
    { name: 'Other', value: 35000, entityType: 'Wallet' }
  ];

  // Get primary entity and tags
  const primaryEntityId = getEntityFromAddress();
  const entityTags = primaryEntityId ? getEntityTags(primaryEntityId) : [];
  const twitterHandle = getTwitterHandle();

  // Check if we have data to display (either from search or from default address with data)
  const shouldShowData = hasData || (address && !isLoadingAnyData && (counterpartyTransactionData || addressSummaryData || addressBlockStatsData));

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
      setAddress(address);
      setSearchValue(address);
      setHasData(true);
    }
  };

  return (
    <ViewWrapper
      icon={<BarChart3 className="w-7 h-7 text-brand-primary" />}
      title="Risk Dashboard"
      fullWidth={true}
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Enter blockchain address (e.g., 0x1234... or bc1qxy2...)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchValue)}
            className={`w-full px-4 py-3 pr-12 rounded-lg border transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
            }`}
            disabled={loading}
          />
          <button
            onClick={() => handleSearch(searchValue)}
            disabled={loading}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-md transition-colors ${
              loading 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-brand-primary hover:bg-brand-primary/10'
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Welcome Message - Show when no search has been performed and no data available */}
      {!shouldShowData && !loading && !isLoadingAnyData && (
        <div className="text-center py-16 px-5 max-w-2xl mx-auto">
          <BarChart3 className={`w-16 h-16 mx-auto mb-6 opacity-70 ${
            theme === 'dark' ? 'text-brand-primary' : 'text-brand-primary'
          }`} />
          <h3 className={`text-2xl font-semibold mb-4 ${
            theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Risk Dashboard
          </h3>
          <p className={`text-base leading-relaxed mb-6 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Enter a blockchain address above to analyze its risk profile, transaction patterns, and associated entities.
          </p>
          <p className={`text-sm opacity-80 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Supports Bitcoin (bc1q...), Ethereum (0x...), and other major blockchain addresses
          </p>
        </div>
      )}

      {shouldShowData && !loading && !isLoadingAnyData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Address Header - Full Width */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl border p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800/50 border-gray-700' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <AddressHeader 
                address={address}
                entityTags={entityTags}
              />
            </div>
          </div>

          {/* Summary Stats and Risk Assessment - Two Columns */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AddressSummary {...addressSummaryProps} />
              <RiskAssessment 
                score={riskScore ? Math.round(riskScore.overallRisk * 100) : 0}
                level={riskScore ? getRiskLevel(riskScore.overallRisk * 100) : 'Unknown'}
                description={riskScore ? getRiskDescription(riskScore.overallRisk * 100) : 'No risk data available'}
                isLoading={isLoadingRiskScore || loading}
                onSeeDetails={handleRiskScoreClick}
              />
            </div>
          </div>

          {/* Transaction Activity - Full Width */}
          <div className="lg:col-span-2">
            <TransactionActivity transactionActivity={mockTransactionActivity} />
          </div>

          {/* Top Counterparties */}
          <div className="h-[500px]">
            <TopCounterparties 
              incoming={counterpartyData.incoming} 
              outgoing={counterpartyData.outgoing} 
              onCounterpartyClick={handleCounterpartyClick}
              transactions={transformedTransactions}
            />
          </div>
          
          {/* Transaction History */}
          <div className="h-[500px]">
            <TransactionHistory 
              address={address}
            />
          </div>

          {/* Funds Flow Analysis - Full Width */}
          <div className="lg:col-span-2">
            <CombinedFundsFlow 
              incomingData={mockIncomingData}
              outgoingData={mockOutgoingData}
            />
          </div>

          {/* Entity Details */}
          <div>
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
          </div>
          
          {/* Twitter Timeline */}
          <div>
            <TwitterTimeline 
              username={twitterHandle}
              title="Twitter Feed"
            />
          </div>
        </div>
      )}

      {(loading || isLoadingAnyData) && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Address Header Skeleton */}
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
            </div>

            {/* Summary Stats and Risk Assessment Skeleton - Two Columns */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`rounded-2xl border p-6 ${
                  theme === 'dark' 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
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
                
                <div className={`rounded-2xl border p-6 ${
                  theme === 'dark' 
                    ? 'bg-gray-800/50 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Activity Skeleton */}
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-4"></div>
                  <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
            </div>

            {/* Top Counterparties Skeleton */}
            <div className="h-[500px]">
              <div className={`rounded-2xl border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-36 mb-4"></div>
                  <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
            </div>
            
            {/* Transaction History Skeleton */}
            <div className="h-[500px]">
              <div className={`rounded-2xl border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
                  <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
            </div>

            {/* Funds Flow Analysis Skeleton */}
            <div className="lg:col-span-2">
              <div className={`rounded-2xl border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-36 mb-4"></div>
                  <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
            </div>

            {/* Entity Details Skeleton */}
            <div>
              <div className={`rounded-2xl border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                  <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
            </div>
            
            {/* Twitter Timeline Skeleton */}
            <div>
              <div className={`rounded-2xl border p-6 ${
                theme === 'dark' 
                  ? 'bg-gray-800/50 border-gray-700' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-4"></div>
                  <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading indicator */}
          <div className="text-center py-5 mt-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-primary" />
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Analyzing blockchain address and gathering risk intelligence...
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className={`mb-4 p-4 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-red-900/20 border-red-700 text-red-200' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {riskScoreError && (
        <div className={`mb-4 p-4 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-yellow-900/20 border-yellow-700 text-yellow-200' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Risk Score Error</span>
          </div>
          <p className="mt-1">{riskScoreError}</p>
        </div>
      )}

      {addressError && (
        <div className={`mb-4 p-4 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-yellow-900/20 border-yellow-700 text-yellow-200' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
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
