import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import AddressSearchInput from '../../components/common/AddressSearchInput';
import EmptyState from '../../components/common/EmptyState';
import ViewWrapper from '../../components/ViewWrapper';
import { useTheme } from '../../context/ThemeContext';
import { 
  RiskAssessment, 
  TransactionActivity,
  TopCounterparties, 
  TransactionHistory, 
  EntityDetails,
  RiskScoreModal
} from './components';
// import { EnhancedD3SankeyDiagram } from './components/EnhancedD3SankeyDiagram';
import { SimpleSankeyTest } from './components/SimpleSankeyTest';
import SocialMediaFeed from './components/entity-intelligence/SocialMediaFeed';
import { AddressSummary } from './components/AddressSummary';
import AddressHeader from './components/address/AddressHeader';
import { useAddressTransactions } from '../../hooks/useAddressTransactions';
import { useAddressSummary } from '../../hooks/useAddressSummary';
import { useAddressBlockStats } from '../../hooks/useAddressBlockStats';
import { useAddress } from '../../hooks/useAddress';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';
import { useRiskScore } from '../../hooks/useRiskScore';
import { transformBtcTransactions } from '../../utils/transactionTransformers';
import { useAttribution } from '../../context/AttributionContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { RootState } from '../../store/store';
import { getEntityTypeLabel } from '../../utils/display-labels';
import { EEntityType } from '../../typings/SOT';
import { fetchSOT } from '../../store/slices/sotSlice';

const RiskDashboard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [address, setAddress] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [riskScoreModalVisible, setRiskScoreModalVisible] = useState(false);
  const [entityDetailsHeight, setEntityDetailsHeight] = useState<number | undefined>(undefined);
  const entityDetailsRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    // Initialize with current year, will be updated when transaction data is available
    return new Date().getFullYear();
  });
  const hasSetInitialYear = useRef(false);

  // Debug: Log when address changes and reset year selection flag
  useEffect(() => {
    console.log('Address changed to:', address);
    hasSetInitialYear.current = false; // Reset flag when address changes
  }, [address]);

  // React Query hooks - Fetch more transactions for activity analysis
  const { data: counterpartyTransactionData, isLoading: isLoadingTransactions } = useAddressTransactions(address, 1, 100);
  const { data: activityTransactionData, isLoading: isLoadingActivityTransactions } = useAddressTransactions(address, 1, 1000);
  const { data: addressSummaryData, isLoading: isLoadingAddressSummary } = useAddressSummary(address);
  const { data: addressBlockStatsData, isLoading: isLoadingAddressBlockStats } = useAddressBlockStats(address);
  const { isLoading: isLoadingAddress, error: addressError } = useAddress(address);
  const { getPrice } = useCryptoPrices();
  const { riskScore, isLoading: isLoadingRiskScore, error: riskScoreError } = useRiskScore(address);
  
  // Memoize BTC price to prevent unnecessary recalculations
  const btcPrice = useMemo(() => getPrice('BTC') || 35000, [getPrice]);

  // Attribution and SOT data hooks
  const { fetchAttributions, attributions } = useAttribution();
  const { itemsMap, items } = useAppSelector((state: RootState) => state.sot);
  const dispatch = useAppDispatch();

  // Load SOT data on component mount
  useEffect(() => {
    console.log('Loading SOT data on component mount');
    dispatch(fetchSOT());
  }, [dispatch]);

  // Debug: Log itemsMap and attributions changes
  useEffect(() => {
    console.log('itemsMap updated:', { 
      itemsMapKeys: Object.keys(itemsMap).length,
      sampleItems: Object.values(itemsMap).slice(0, 3).map(item => ({ entity_id: item.entity_id, proper_name: item.proper_name }))
    });
  }, [itemsMap]);

  useEffect(() => {
    console.log('attributions updated:', { 
      attributionKeys: Object.keys(attributions).length,
      sampleAttributions: Object.entries(attributions).slice(0, 3)
    });
  }, [attributions]);

  // Loading state - memoized to prevent unnecessary recalculations
  const isLoadingAnyData = useMemo(() => 
    isLoadingTransactions || 
    isLoadingActivityTransactions || 
    isLoadingAddressSummary || 
    isLoadingAddressBlockStats || 
    isLoadingAddress || 
    isLoadingRiskScore,
    [isLoadingTransactions, isLoadingActivityTransactions, isLoadingAddressSummary, isLoadingAddressBlockStats, isLoadingAddress, isLoadingRiskScore]
  );

  // Calculate transaction counts for each year - memoized
  const yearTransactionCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    
    const txData = activityTransactionData?.txs || counterpartyTransactionData?.txs || [];
    
    console.log('Calculating yearTransactionCounts - txData length:', txData.length);
    console.log('Calculating yearTransactionCounts - sample txData:', txData.slice(0, 3));
    
    txData.forEach(tx => {
      const txYear = new Date(tx.timestamp * 1000).getFullYear();
      counts[txYear] = (counts[txYear] || 0) + 1;
    });
    
    console.log('Calculating yearTransactionCounts - final counts:', counts);
    return counts;
  }, [activityTransactionData?.txs, counterpartyTransactionData?.txs]);

  // Set default year to the year with most transactions
  useEffect(() => {
    console.log('Year selection effect - yearTransactionCounts:', yearTransactionCounts);
    console.log('Year selection effect - hasSetInitialYear.current:', hasSetInitialYear.current);
    console.log('Year selection effect - current selectedYear:', selectedYear);
    
    if (Object.keys(yearTransactionCounts).length > 0 && !hasSetInitialYear.current) {
      const yearWithMostTransactions = Object.entries(yearTransactionCounts)
        .reduce((max, [year, count]) => count > max.count ? { year: parseInt(year), count } : max, 
          { year: new Date().getFullYear(), count: 0 });
      
      console.log('Year selection effect - yearWithMostTransactions:', yearWithMostTransactions);
      
      if (yearWithMostTransactions.count > 0) {
        console.log('Setting selected year to:', yearWithMostTransactions.year);
        setSelectedYear(yearWithMostTransactions.year);
        hasSetInitialYear.current = true;
      }
    }
  }, [yearTransactionCounts]);

  // Transform transaction data for counterparty analysis - memoized
  const transformedTransactions = useMemo(() => {
    if (!counterpartyTransactionData?.txs) return [];
    return transformBtcTransactions(counterpartyTransactionData.txs, address, btcPrice);
  }, [counterpartyTransactionData?.txs, address, btcPrice]);

  // Fetch attributions for counterparty addresses when transaction data changes
  useEffect(() => {
    if (!transformedTransactions.length || !address) return;
    
    // Extract unique counterparty addresses from transactions
    const counterpartyAddresses = new Set<string>();
    transformedTransactions.forEach(tx => {
      if (tx.from && tx.from !== 'Unknown' && tx.from !== address) {
        counterpartyAddresses.add(tx.from);
      }
      if (tx.to && tx.to !== 'Unknown' && tx.to !== address) {
        counterpartyAddresses.add(tx.to);
      }
    });
    
    // Fetch attributions for counterparty addresses that don't already have attributions
    const addressesToFetch = Array.from(counterpartyAddresses).filter(addr => !attributions[addr]);
    
    if (addressesToFetch.length > 0) {
      console.log('RiskDashboard: Fetching attributions for counterparty addresses:', addressesToFetch);
      fetchAttributions(addressesToFetch);
    }
  }, [transformedTransactions, address, attributions, fetchAttributions]);

  // Function to truncate addresses for display - memoized
  const truncateAddress = useCallback((address: string, startLength: number = 6, endLength: number = 4) => {
    if (address.length <= startLength + endLength + 3) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }, []);

  // Generate counterparty data from transaction history - memoized
  const counterpartyData = useMemo(() => {
    if (!transformedTransactions.length) {
      return { incoming: [], outgoing: [] };
    }

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

    const incomingCounterparties = Object.entries(incomingByAddress)
      .map(([address, data]) => {
        const entityId = attributions[address]?.entity || attributions[address]?.bo || attributions[address]?.custodian;
        console.log('Processing incoming counterparty:', { address, entityId, itemsMapKeys: Object.keys(itemsMap).length });
        const entity = entityId ? Object.values(itemsMap).find(sot => sot.entity_id === entityId) : null;
        console.log('Found entity:', entity);
        const entityName = entity?.proper_name || address;
        
        return {
          entity: entityName,
          entityId: entityId || undefined,
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
        const entity = entityId ? Object.values(itemsMap).find(sot => sot.entity_id === entityId) : null;
        const entityName = entity?.proper_name || address;
        
        return {
          entity: entityName,
          entityId: entityId || undefined,
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
  }, [transformedTransactions, attributions, btcPrice, itemsMap, truncateAddress]);

  // Prepare address summary data for the component - memoized
  const addressSummaryProps = useMemo(() => {
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
    const totalVolume = addressSummaryData.total_received ? addressSummaryData.total_received / 100000000 : 0;
    const firstSeen = addressBlockStatsData.firstBlock?.blockNumber?.toString() || '';
    const lastSeen = addressBlockStatsData.lastBlock?.blockNumber?.toString() || '';
    const avgTxSize = totalTxns > 0 ? totalVolume / totalTxns : 0;

    const inputAmount = addressSummaryData.total_received ? addressSummaryData.total_received / 100000000 : 0;
    const outputAmount = addressSummaryData.total_spent ? addressSummaryData.total_spent / 100000000 : 0;
    const balance = addressSummaryData.balance ? addressSummaryData.balance / 100000000 : 0;
    let topCounterparty = 'N/A';

    if (transformedTransactions.length > 0) {
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
        const entity = entityId ? Object.values(itemsMap).find(sot => sot.entity_id === entityId) : null;
        topCounterparty = entity?.proper_name || topCounterpartyAddress;
      }
    }

    return {
      totalTransactions: totalTxns,
      totalVolume,
      firstSeen,
      lastSeen,
      averageTransactionSize: avgTxSize,
      inputAmount,
      outputAmount,
      balance,
      topCounterparty,
      isLoading: isLoadingAddressSummary || isLoadingAddressBlockStats
    };
  }, [addressSummaryData, addressBlockStatsData, counterpartyTransactionData, isLoadingAddressSummary, isLoadingAddressBlockStats, transformedTransactions, attributions, itemsMap]);

  // Restore handleResize and related logic - memoized
  const handleResize = useCallback(() => {
    if (entityDetailsRef.current) {
      const newHeight = entityDetailsRef.current.offsetHeight;
      setEntityDetailsHeight(prev => (prev !== newHeight ? newHeight : prev));
    }
  }, []);

  // Entity helper functions - memoized
  const getEntityType = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.entity_type ? getEntityTypeLabel(entity.entity_type as EEntityType) : 'Unknown';
  }, [items]);

  const getEntityLogo = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.logo || '';
  }, [items]);

  const getEntityDescription = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.description_merged || 'No description available';
  }, [items]);

  const getEntityWebsite = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.url || '';
  }, [items]);

  const getEntityPhone = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.contact_phone || '';
  }, [items]);

  const getEntityAddress = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.contact_address || '';
  }, [items]);

  const getEntityFounded = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.year_founded ? parseInt(entity.year_founded) : 0;
  }, [items]);

  const getEntityCountries = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    if (!entity) return [];
    
    const countries = [];
    for (let i = 1; i <= 6; i++) {
      const country = entity[`associate_country_${i}` as keyof typeof entity];
      if (country && typeof country === 'string' && country.trim() !== '') {
        countries.push(country);
      }
    }
    return countries;
  }, [items]);

  const getEntityTags = useCallback((entityId: string): string[] => {
    const entity = items.find(item => item.entity_id === entityId);
    if (!entity) return [];
    
    const tags: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const tag = entity[`entity_tag${i}` as keyof typeof entity];
      if (tag && typeof tag === 'string') {
        tags.push(tag);
      }
    }
    return tags;
  }, [items]);

  // Additional entity helper functions - memoized
  const getEntityEmail = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.contact_email || '';
  }, [items]);

  const getEntityTwitter = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.contact_twitter || '';
  }, [items]);

  const getEntityTelegram = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.contact_telegram || '';
  }, [items]);

  const getEntityEnsAddress = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.ens_address || '';
  }, [items]);

  const getEntityLegalInfoUrl = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.legal_info_url || '';
  }, [items]);

  const getEntityCeo = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.ceo || '';
  }, [items]);

  const getEntityKeyPersonnel = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.key_personnel || '';
  }, [items]);

  const getEntityTicker = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.ticker || '';
  }, [items]);

  const getEntityParentId = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.parent_id || '';
  }, [items]);

  const getEntitySocialMediaProfiles = useCallback((entityId: string): string[] => {
    const entity = items.find(item => item.entity_id === entityId);
    if (!entity) return [];
    
    const profiles: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const profile = entity[`social_media_profile${i === 1 ? '' : '_' + i}` as keyof typeof entity];
      if (profile && typeof profile === 'string' && profile.trim() !== '') {
        profiles.push(profile);
      }
    }
    return profiles;
  }, [items]);

  const getEntityIsCentralized = useCallback((entityId: string): boolean | undefined => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.centralized ?? undefined;
  }, [items]);

  const getEntityNoKycRequired = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.no_kyc_req || false;
  }, [items]);

  const getEntityIsDead = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.dead || false;
  }, [items]);

  const getEntityIsOfacSanctioned = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.ofac || false;
  }, [items]);

  const getEntityNote = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.note || '';
  }, [items]);

  const getEntityLastUpdated = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.date_updated || '';
  }, [items]);

  const getEntityLastModifiedBy = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.user || '';
  }, [items]);

  const getEntityRevisitSite = useCallback((entityId: string) => {
    const entity = items.find(item => item.entity_id === entityId);
    return entity?.revisit_site || false;
  }, [items]);

  // Risk level helper functions - memoized
  const getRiskLevel = useCallback((score: number): string => {
    if (score >= 80) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 20) return 'Low';
    return 'Very Low';
  }, []);

  const getRiskDescription = useCallback((score: number): string => {
    if (score >= 80) {
      return 'This address shows significant risk indicators including high transaction volumes, connections to known risky entities, and unusual activity patterns.';
    } else if (score >= 50) {
      return 'This address displays moderate risk factors with some concerning transaction patterns and entity connections that warrant attention.';
    } else if (score >= 20) {
      return 'This address shows low risk indicators with mostly normal transaction patterns and few concerning connections.';
    } else {
      return 'This address appears to be low risk with normal transaction patterns and no significant concerning indicators.';
    }
  }, []);

  // Generate transaction activity data from real transaction data - memoized
  const transactionActivityData = useMemo(() => {
    const txData = activityTransactionData?.txs || counterpartyTransactionData?.txs || [];
    
    if (!txData.length || !address) {
      return Array.from({ length: 365 }, (_, i) => ({
        day: i % 7,
        week: Math.floor(i / 7),
        active: false,
        activityCount: 0
      }));
    }

    const filteredTxData = txData.filter(tx => {
      const txYear = new Date(tx.timestamp * 1000).getFullYear();
      return txYear === selectedYear;
    });

    const dateMap = new Map<string, number>();
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31);
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startOfYear);
      date.setDate(date.getDate() + i);
      if (date <= endOfYear) {
        const dateKey = date.toISOString().split('T')[0];
        dateMap.set(dateKey, 0);
      }
    }

    filteredTxData.forEach(tx => {
      const txDate = new Date(tx.timestamp * 1000);
      const dateKey = txDate.toISOString().split('T')[0];
      if (dateMap.has(dateKey)) {
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    });

    const result = [];
    
    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        const firstDayOfYear = new Date(selectedYear, 0, 1);
        const dayOfWeek = firstDayOfYear.getDay();
        
        const daysToFirstMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
        const firstMonday = new Date(selectedYear, 0, 1 + daysToFirstMonday);
        
        const targetDate = new Date(firstMonday);
        targetDate.setDate(firstMonday.getDate() + (week * 7) + day);
        
        if (targetDate.getFullYear() === selectedYear) {
          const dateKey = targetDate.toISOString().split('T')[0];
          const txCount = dateMap.get(dateKey) || 0;
          
          result.push({
            day: day,
            week: week,
            active: txCount > 0,
            activityCount: txCount
          });
        }
      }
    }

    return result;
  }, [activityTransactionData?.txs, counterpartyTransactionData?.txs, address, selectedYear]);

  // Get primary entity and tags - memoized
  const primaryEntityId = useMemo(() => {
    const attribution = attributions[address];
    return attribution?.entity || attribution?.bo || attribution?.custodian;
  }, [attributions, address]);

  const entityTags = useMemo(() => primaryEntityId ? getEntityTags(primaryEntityId) : [], [primaryEntityId, getEntityTags]);

  // Properly handle ResizeObserver cleanup
  useEffect(() => {
    if (!entityDetailsRef.current || !primaryEntityId) return;
    
    handleResize();
    
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(entityDetailsRef.current);
    }
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [primaryEntityId, handleResize]);



  // Check if we have data to display - memoized
  const shouldShowData = useMemo(() => 
    hasData && address && !isLoadingAnyData && (counterpartyTransactionData || addressSummaryData || addressBlockStatsData),
    [hasData, address, isLoadingAnyData, counterpartyTransactionData, addressSummaryData, addressBlockStatsData]
  );

  // Handle address search - memoized
  const handleAddressSearch = useCallback(async (value: string) => {
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
  }, [fetchAttributions, dispatch]);

  const handleSearch = useCallback((value: string) => {
    handleAddressSearch(value);
  }, [handleAddressSearch]);

  const handleRiskScoreClick = useCallback(() => {
    setRiskScoreModalVisible(true);
  }, []);

  // Handle counterparty click to navigate to that address - memoized
  const handleCounterpartyClick = useCallback((address: string) => {
    if (address && address.trim()) {
      handleAddressSearch(address);
    }
  }, [handleAddressSearch]);

  const isEmptyState = !shouldShowData && !loading && !isLoadingAnyData;

  return (
    <ViewWrapper
      icon={<BarChart3 className="w-8 h-8 text-orange-500" />}
      title={isEmptyState ? "Risk Dashboard" : ""}
      fullWidth={true}
    >
      {/* Sticky Search Bar */}
      <div className={`sticky top-[0] z-20 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 px-4 ${isEmptyState ? 'pt-2 py-4 mb-2' : 'py-4'}`}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 max-w-2xl">
            <AddressSearchInput
              placeholder="Enter Bitcoin or Ethereum address (e.g., 0x1234... or bc1qxy2...)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              loading={loading}
              disabled={loading}
              showValidation={true}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isEmptyState ? (
        <EmptyState
          variant="initial"
          icon={<BarChart3 className="w-12 h-12" />}
          title="Welcome to Risk Dashboard"
          description="Analyze blockchain addresses for risk assessment, transaction patterns, and entity intelligence. Get comprehensive insights into address behavior, counterparty analysis, and risk scoring."
        />
      ) : (
        <div className="space-y-6">
          {/* Address Header - Full Width */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700 mt-8">
            <AddressHeader 
              address={address}
              entityTags={entityTags}
              entityName={primaryEntityId ? (itemsMap[primaryEntityId]?.proper_name || primaryEntityId) : undefined}
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

          {/* Transaction Activity - Full Width - Show for every address */}
          <div>
            {/* Year Filter */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>Transaction Activity Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {Array.from({ length: 16 }, (_, i) => {
                    const year = 2025 - i;
                    const txCount = yearTransactionCounts[year] || 0;
                    return (
                      <option key={year} value={year}>
                        {year} ({txCount} tx{txCount !== 1 ? 's' : ''})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            
            <TransactionActivity 
              transactionActivity={transactionActivityData} 
              isLoading={isLoadingAnyData}
              selectedYear={selectedYear}
              address={address}
              transactions={activityTransactionData?.txs || []}
            />
          </div>

          {/* Top Counterparties and Transaction History - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <TopCounterparties 
                incoming={counterpartyData.incoming} 
                outgoing={counterpartyData.outgoing} 
                onCounterpartyClick={handleCounterpartyClick}
                transactions={transformedTransactions}
              />
            </div>
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <TransactionHistory 
                address={address}
              />
            </div>
          </div>



          {/* D3 Sankey Diagram - Full Width */}
          {address && (
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <SimpleSankeyTest 
                address={address}
                maxTransactions={20}
                addressSummaryData={addressSummaryData}
              />
            </div>
          )}

          {/* Entity Details and Twitter Timeline - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div ref={entityDetailsRef} className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <EntityDetails 
                name={primaryEntityId ? (items.find(item => item.entity_id === primaryEntityId)?.proper_name || primaryEntityId) : "Unknown Entity"}
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
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700" style={entityDetailsHeight ? { height: Math.max(entityDetailsHeight, 300) } : { minHeight: '300px' }}>
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
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>

          {/* Summary Stats and Risk Assessment Skeleton - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
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
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Transaction Activity Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-4"></div>
              <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>

          {/* Top Counterparties and Transaction History Skeleton - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-36 mb-4"></div>
                <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
                <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Funds Flow Analysis Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-36 mb-4"></div>
              <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>

          {/* Entity Details and Twitter Timeline Skeleton - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
                <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              </div>
            </div>
            
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
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
});

RiskDashboard.displayName = 'RiskDashboard';

export default RiskDashboard;
