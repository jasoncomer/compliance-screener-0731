import React, { useCallback, useEffect, useMemo,useRef, useState } from 'react';

import { AlertCircle,BarChart3, StickyNote } from 'lucide-react';

import AddressSearchInput from '../../components/common/AddressSearchInput';
import EmptyState from '../../components/common/EmptyState';
import EntityHeightMeasurer from '../../components/EntityHeightMeasurer';
import NotesPanel from '../../components/common/NotesPanel';
import ViewWrapper from '../../components/ViewWrapper';
import { useAttribution } from '../../context/AttributionContext';
import { useTheme } from '../../context/ThemeContext';
import { useAddress } from '../../hooks/useAddress';
import { useAddressBlockStats } from '../../hooks/useAddressBlockStats';
import { useAddressSummary } from '../../hooks/useAddressSummary';
import { useAddressTransactions } from '../../hooks/useAddressTransactions';
import { useCryptoPrices } from '../../hooks/useCryptoPrices';
import { useRiskScore } from '../../hooks/useRiskScore';
import { useAppDispatch,useAppSelector } from '../../store/hooks';
import { fetchSOT } from '../../store/slices/sotSlice';
import { RootState } from '../../store/store';
import { EEntityType } from '../../typings/SOT';
import { getEntityTypeLabel } from '../../utils/display-labels';
import { applyBeneficialOwnerOverride } from '../../utils/entityUtils';
import { transformBtcTransactions } from '../../utils/transactionTransformers';
import AddressNotFound from '../blockexplorer/address-page/AddressNotFound';

import AddressHeader from './components/address/AddressHeader';
import { AddressSummary } from './components/AddressSummary';
import SocialMediaFeed from './components/entity-intelligence/SocialMediaFeed';
// import { EnhancedD3SankeyDiagram } from './components/EnhancedD3SankeyDiagram';
import { SimpleSankeyTest } from './components/SimpleSankeyTest';
import { 
  EntityDetails,
  GeographicPresence,
  RiskSummary,
  TopCounterparties, 
  TransactionActivity,
  TransactionHistory} from './components';

const RiskDashboard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);
  const [address, setAddress] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [addressNotFound, setAddressNotFound] = useState<boolean>(false);
  const [entityDetailsHeight, setEntityDetailsHeight] = useState<number | undefined>(undefined);
  const entityDetailsRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    // Initialize with current year, will be updated when transaction data is available
    return new Date().getFullYear();
  });
  const hasSetInitialYear = useRef(false);
  
  // Entity toggle state
  const [isBeneficialOwner, setIsBeneficialOwner] = useState(false);
  
  // Height management for both entities
  const [maxEntityHeight, setMaxEntityHeight] = useState<number>(600); // Start with a reasonable default
  const heightMeasurerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hasSetInitialYear.current = false; // Reset flag when address changes
    setIsBeneficialOwner(false); // Reset toggle state when address changes
    setMaxEntityHeight(600); // Reset height to default when address changes
    setAddressNotFound(false); // Reset address not found state when address changes
  }, [address]);

  // React Query hooks - Fetch more transactions for activity analysis
  const { data: counterpartyTransactionData, isLoading: isLoadingTransactions } = useAddressTransactions(address, 1, 100);
  const { data: activityTransactionData, isLoading: isLoadingActivityTransactions } = useAddressTransactions(address, 1, 1000);
  const { data: addressSummaryData, isLoading: isLoadingAddressSummary } = useAddressSummary(address);
  const { data: addressBlockStatsData, isLoading: isLoadingAddressBlockStats } = useAddressBlockStats(address);
  const { data: addressData, isLoading: isLoadingAddress, error: addressError } = useAddress(address);
  const { getPrice } = useCryptoPrices();
  const { riskScore, isLoading: isLoadingRiskScore, error: riskScoreError } = useRiskScore(address);
  
  // Memoize BTC price to prevent unnecessary recalculations
  const btcPrice = useMemo(() => getPrice('BTC') || 35000, [getPrice]);

  // Monitor addressError and address data to detect address not found
  useEffect(() => {
    if (addressError && address) {
      // Check if it's a 404 or address not found error
      // Type guard to check if error has response property (AxiosError)
      const isAxiosError = (error: unknown): error is { response?: { status?: number; data?: { message?: string } } } => {
        return typeof error === 'object' && error !== null && 'response' in error;
      };

      if (isAxiosError(addressError)) {
        // Handle AxiosError with response
        if (addressError.response?.status === 404 || 
            addressError.response?.data?.message?.toLowerCase().includes('not found') ||
            addressError.response?.data?.message?.toLowerCase().includes('address not found')) {
          setAddressNotFound(true);
        } else {
          setAddressNotFound(false);
        }
      } else if (addressError instanceof Error) {
        // Handle generic Error
        if (addressError.message?.toLowerCase().includes('cannot read properties of undefined') ||
            addressError.message?.toLowerCase().includes('balance')) {
          setAddressNotFound(true);
        } else {
          setAddressNotFound(false);
        }
      } else {
        setAddressNotFound(false);
      }
    } else if (address && !isLoadingAddress && !addressError) {
      // If we have an address but no data and no error, and we're not loading, 
      // check if the address data is valid
      if (!addressData || !addressData.addr) {
        setAddressNotFound(true);
      } else {
        setAddressNotFound(false);
      }
    } else if (!address) {
      setAddressNotFound(false);
    }
  }, [addressError, address, isLoadingAddress, addressData]);

  // Attribution and SOT data hooks
  const { fetchAttributions, attributions } = useAttribution();
  const { itemsMap, items } = useAppSelector((state: RootState) => state.sot);
  const dispatch = useAppDispatch();

  // Apply BO override logic to risk score
  const enhancedRiskScore = useMemo(() => {
    if (!riskScore || !address || !attributions[address] || Object.keys(itemsMap).length === 0) {
      return riskScore;
    }

    const attribution = attributions[address];
    
    // Apply BO override if beneficial owner exists and is different from entity
    if (attribution.bo && attribution.bo !== attribution.entity) {
      const entitySOT = itemsMap[attribution.entity];
      const beneficialOwnerSOT = itemsMap[attribution.bo];
      
      if (beneficialOwnerSOT) {
        // Apply BO override logic
        const override = applyBeneficialOwnerOverride(
          {
            entity: attribution.entity,
            bo: attribution.bo || '',
            custodian: attribution.custodian || '',
            script_type: attribution.script_type
          },
          entitySOT,
          beneficialOwnerSOT,
          riskScore.riskScores,
          address
        );
        
        // Create enhanced risk score with BO override applied
        const enhancedScore = {
          ...riskScore,
          overallRisk: override.riskScore ? override.riskScore / 100 : riskScore.overallRisk, // Convert back to 0-1 range
          boInfo: {
            entityName: override.entityName,
            entityType: override.entityType,
            entityTags: override.entityTags,
            ofac: override.ofac,
            isBeneficialOwnerOverride: override.isBeneficialOwnerOverride
          }
        };
        
        console.log('🔍 Risk Dashboard BO Override Applied:', {
          address,
          originalRiskScore: Math.round(riskScore.overallRisk * 100),
          boRiskScore: override.riskScore,
          boName: override.entityName,
          boOfac: override.ofac
        });
        
        return enhancedScore;
      }
    }
    
    return riskScore;
  }, [riskScore, address, attributions, itemsMap]);

  // Load SOT data on component mount
  useEffect(() => {
    dispatch(fetchSOT());
  }, [dispatch]);

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
    txData.forEach(tx => {
      const txYear = new Date(tx.timestamp * 1000).getFullYear();
      counts[txYear] = (counts[txYear] || 0) + 1;
    });
    
    return counts;
  }, [activityTransactionData?.txs, counterpartyTransactionData?.txs]);

  // Set default year to the year with most transactions
  useEffect(() => {
    if (Object.keys(yearTransactionCounts).length > 0 && !hasSetInitialYear.current) {
      const yearWithMostTransactions = Object.entries(yearTransactionCounts)
        .reduce((max, [year, count]) => count > max.count ? { year: parseInt(year), count } : max, 
          { year: new Date().getFullYear(), count: 0 });
      
      
      if (yearWithMostTransactions.count > 0) {
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
        const entity = entityId ? Object.values(itemsMap).find(sot => sot.entity_id === entityId) : null;
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

  // Toggle logic - determine if we should show toggle and get current entity data
  const attribution = attributions[address];
  const showToggle = useMemo(() => {
    if (!attribution) return false;
    // Show toggle if both entity and beneficial owner exist and are different
    return !!(attribution.entity && attribution.bo && attribution.entity !== attribution.bo);
  }, [attribution]);

  // Get current entity data based on toggle state
  const currentEntityId = useMemo(() => {
    if (!attribution) return primaryEntityId;
    return isBeneficialOwner ? attribution.bo : attribution.entity;
  }, [attribution, isBeneficialOwner, primaryEntityId]);

  // Get entity names for toggle display
  const custodialEntityName = useMemo(() => {
    if (!attribution?.entity) return "Custodial Entity";
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === attribution.entity);
    return entity?.proper_name || attribution.entity;
  }, [attribution?.entity, itemsMap]);

  const beneficialOwnerName = useMemo(() => {
    if (!attribution?.bo) return "Beneficial Owner";
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === attribution.bo);
    return entity?.proper_name || attribution.bo;
  }, [attribution?.bo, itemsMap]);

  // Get entity data for both custodial and beneficial owner
  const custodialEntityData = useMemo(() => {
    if (!attribution?.entity) return null;
    const entityId = attribution.entity;
    return {
      name: items.find(item => item.entity_id === entityId)?.proper_name || entityId,
      type: getEntityType(entityId),
      description: getEntityDescription(entityId),
      website: getEntityWebsite(entityId),
      phone: getEntityPhone(entityId),
      address: getEntityAddress(entityId),
      founded: getEntityFounded(entityId),
      logo: getEntityLogo(entityId) || "",
      countries: getEntityCountries(entityId),
      entityId: entityId,
      email: getEntityEmail(entityId),
      twitter: getEntityTwitter(entityId),
      telegram: getEntityTelegram(entityId),
      ensAddress: getEntityEnsAddress(entityId),
      legalInfoUrl: getEntityLegalInfoUrl(entityId),
      ceo: getEntityCeo(entityId),
      keyPersonnel: getEntityKeyPersonnel(entityId),
      ticker: getEntityTicker(entityId),
      parentId: getEntityParentId(entityId),
      entityTags: getEntityTags(entityId),
      socialMediaProfiles: getEntitySocialMediaProfiles(entityId),
      isCentralized: getEntityIsCentralized(entityId),
      noKycRequired: getEntityNoKycRequired(entityId),
      isDead: getEntityIsDead(entityId),
      isOfacSanctioned: getEntityIsOfacSanctioned(entityId),
      note: getEntityNote(entityId),
      lastUpdated: getEntityLastUpdated(entityId),
      lastModifiedBy: getEntityLastModifiedBy(entityId),
      revisitSite: getEntityRevisitSite(entityId)
    };
  }, [attribution?.entity, items, getEntityType, getEntityDescription, getEntityWebsite, getEntityPhone, getEntityAddress, getEntityFounded, getEntityLogo, getEntityCountries, getEntityEmail, getEntityTwitter, getEntityTelegram, getEntityEnsAddress, getEntityLegalInfoUrl, getEntityCeo, getEntityKeyPersonnel, getEntityTicker, getEntityParentId, getEntityTags, getEntitySocialMediaProfiles, getEntityIsCentralized, getEntityNoKycRequired, getEntityIsDead, getEntityIsOfacSanctioned, getEntityNote, getEntityLastUpdated, getEntityLastModifiedBy, getEntityRevisitSite]);

  const beneficialOwnerEntityData = useMemo(() => {
    if (!attribution?.bo) return null;
    const entityId = attribution.bo;
    return {
      name: items.find(item => item.entity_id === entityId)?.proper_name || entityId,
      type: getEntityType(entityId),
      description: getEntityDescription(entityId),
      website: getEntityWebsite(entityId),
      phone: getEntityPhone(entityId),
      address: getEntityAddress(entityId),
      founded: getEntityFounded(entityId),
      logo: getEntityLogo(entityId) || "",
      countries: getEntityCountries(entityId),
      entityId: entityId,
      email: getEntityEmail(entityId),
      twitter: getEntityTwitter(entityId),
      telegram: getEntityTelegram(entityId),
      ensAddress: getEntityEnsAddress(entityId),
      legalInfoUrl: getEntityLegalInfoUrl(entityId),
      ceo: getEntityCeo(entityId),
      keyPersonnel: getEntityKeyPersonnel(entityId),
      ticker: getEntityTicker(entityId),
      parentId: getEntityParentId(entityId),
      entityTags: getEntityTags(entityId),
      socialMediaProfiles: getEntitySocialMediaProfiles(entityId),
      isCentralized: getEntityIsCentralized(entityId),
      noKycRequired: getEntityNoKycRequired(entityId),
      isDead: getEntityIsDead(entityId),
      isOfacSanctioned: getEntityIsOfacSanctioned(entityId),
      note: getEntityNote(entityId),
      lastUpdated: getEntityLastUpdated(entityId),
      lastModifiedBy: getEntityLastModifiedBy(entityId),
      revisitSite: getEntityRevisitSite(entityId)
    };
  }, [attribution?.bo, items, getEntityType, getEntityDescription, getEntityWebsite, getEntityPhone, getEntityAddress, getEntityFounded, getEntityLogo, getEntityCountries, getEntityEmail, getEntityTwitter, getEntityTelegram, getEntityEnsAddress, getEntityLegalInfoUrl, getEntityCeo, getEntityKeyPersonnel, getEntityTicker, getEntityParentId, getEntityTags, getEntitySocialMediaProfiles, getEntityIsCentralized, getEntityNoKycRequired, getEntityIsDead, getEntityIsOfacSanctioned, getEntityNote, getEntityLastUpdated, getEntityLastModifiedBy, getEntityRevisitSite]);

  // Measure both entity heights and set maximum
  const measureEntityHeights = useCallback(() => {
    if (!showToggle || !attribution || !heightMeasurerRef.current) return;
    
    const measurer = heightMeasurerRef.current;
    const custodialElement = measurer.querySelector('.custodial-entity');
    const beneficialElement = measurer.querySelector('.beneficial-owner');
    
    if (custodialElement && beneficialElement) {
      // Cast to HTMLElement to access offsetHeight and scrollHeight
      const custodialHTMLElement = custodialElement as HTMLElement;
      const beneficialHTMLElement = beneficialElement as HTMLElement;
      
      // Use multiple measurement methods for accuracy
      const custodialOffsetHeight = custodialHTMLElement.offsetHeight;
      const custodialScrollHeight = custodialHTMLElement.scrollHeight;
      const beneficialOffsetHeight = beneficialHTMLElement.offsetHeight;
      const beneficialScrollHeight = beneficialHTMLElement.scrollHeight;
      
      // Use the maximum of offsetHeight and scrollHeight for each element
      const custodialHeight = Math.max(custodialOffsetHeight, custodialScrollHeight);
      const beneficialHeight = Math.max(beneficialOffsetHeight, beneficialScrollHeight);
      
      // Add padding to ensure content doesn't get cut off
      const padding = 40; // Increased padding
      const custodialHeightWithPadding = custodialHeight + padding;
      const beneficialHeightWithPadding = beneficialHeight + padding;
      
      // Set the maximum height with a minimum of 500px to ensure content fits
      const maxHeight = Math.max(custodialHeightWithPadding, beneficialHeightWithPadding, 500);
      setMaxEntityHeight(maxHeight);
    }
  }, [showToggle, attribution]);

  // Measure heights when entity data changes
  useEffect(() => {
    if (showToggle && attribution) {
      // Use a longer delay to ensure DOM has fully updated
      const timeoutId = setTimeout(measureEntityHeights, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [showToggle, attribution, currentEntityId, measureEntityHeights]);

  // Also measure heights when the height measurer component mounts
  useEffect(() => {
    if (showToggle && attribution && heightMeasurerRef.current) {
      // Measure immediately when component is available
      const timeoutId = setTimeout(measureEntityHeights, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [showToggle, attribution, measureEntityHeights]);

  // Set up ResizeObserver for height measurer
  useEffect(() => {
    if (!heightMeasurerRef.current || !showToggle) return;

    const resizeObserver = new ResizeObserver(() => {
      measureEntityHeights();
    });

    resizeObserver.observe(heightMeasurerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [showToggle, measureEntityHeights]);

  // Get display name with beneficial owner logic
  const getDisplayName = useMemo(() => {
    if (!address || !attributions[address]) {
      return undefined;
    }

    const attribution = attributions[address];
    const entitySOT = Object.values(itemsMap).find(sot => sot.entity_id === attribution.entity);
    const beneficialOwnerSOT = attribution.bo ? 
      Object.values(itemsMap).find(sot => sot.entity_id === attribution.bo) : undefined;
    
    const override = applyBeneficialOwnerOverride(
      {
        entity: attribution.entity,
        bo: attribution.bo || '',
        custodian: attribution.custodian || '',
        script_type: attribution.script_type
      },
      entitySOT,
      beneficialOwnerSOT,
      undefined, // no riskScores needed here
      address
    );
    
    return override.displayTitle;
  }, [address, attributions, itemsMap]);

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

  // Handle counterparty click to navigate to that address - memoized
  const handleCounterpartyClick = useCallback((address: string) => {
    if (address && address.trim()) {
      handleAddressSearch(address);
    }
  }, [handleAddressSearch]);

  // Handle clearing address for new search - memoized
  const handleClearAddress = useCallback(() => {
    setAddress('');
    setSearchValue('');
    setAddressNotFound(false);
    setError(null);
    setHasData(false);
  }, []);

  const isEmptyState = !shouldShowData && !loading && !isLoadingAnyData;

  // Show not found state if address was not found
  if (addressNotFound) {
    return (
      <ViewWrapper
        icon={<BarChart3 className="w-8 h-8 text-orange-500" />}
        title="Risk Dashboard"
        fullWidth={true}
      >
        <AddressNotFound address={address} redirectTo="risk-dashboard" onClearAddress={handleClearAddress} />
      </ViewWrapper>
    );
  }

  return (
    <ViewWrapper
      icon={<BarChart3 className="w-8 h-8 text-orange-500" />}
      title={isEmptyState ? "Risk Dashboard" : ""}
      fullWidth={true}
    >
      {/* Sticky Search Bar */}
      <div className={`sticky top-[0] z-20 bg-white dark:bg-background border-b border-gray-200 dark:border-gray-700 ${isEmptyState ? 'pt-2 py-4 mb-2' : 'py-4'}`}>
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
      ) : (loading || isLoadingAnyData) ? (
        <div className="space-y-6">
          {/* Address Header Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700 mt-8">
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
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-4"></div>
                <div className="flex items-center justify-center h-32">
                  <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                <div className="mt-4 text-center">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Activity Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
              <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>

          {/* Top Counterparties Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sankey Diagram Skeleton */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-4"></div>
              <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Address Header - Full Width */}
          <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700 mt-8">
            <AddressHeader 
              address={address}
              entityTags={entityTags}
              entityName={getDisplayName}
              entityId={primaryEntityId}
              entityType={primaryEntityId ? getEntityType(primaryEntityId) : undefined}
            />
          </div>

          {/* Summary Stats - Full Width */}
          <div>
            <AddressSummary {...addressSummaryProps} />
          </div>

          {/* Risk Assessment - Full Width with all details inline */}
          <RiskSummary 
            riskScores={enhancedRiskScore}
            address={address}
            isLoading={isLoadingRiskScore || loading}
          />

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

          {/* Height Measurer - Hidden component to measure both entity heights */}
          {showToggle && custodialEntityData && beneficialOwnerEntityData && (
            <EntityHeightMeasurer
              ref={heightMeasurerRef}
              custodialProps={custodialEntityData}
              beneficialOwnerProps={beneficialOwnerEntityData}
              showToggle={showToggle}
              isBeneficialOwner={isBeneficialOwner}
              onToggle={setIsBeneficialOwner}
              custodialEntityName={custodialEntityName}
              beneficialOwnerName={beneficialOwnerName}
            />
          )}

          {/* Entity Details and Twitter Timeline - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div 
              ref={entityDetailsRef} 
              className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700 overflow-y-auto"
              style={maxEntityHeight > 0 ? { height: maxEntityHeight } : {}}
            >
              <EntityDetails 
                name={currentEntityId ? (items.find(item => item.entity_id === currentEntityId)?.proper_name || currentEntityId) : "Unknown Entity"}
                type={currentEntityId ? getEntityType(currentEntityId) : "Unknown"}
                description={currentEntityId ? getEntityDescription(currentEntityId) : "No description available"}
                website={currentEntityId ? getEntityWebsite(currentEntityId) : ""}
                phone={currentEntityId ? getEntityPhone(currentEntityId) : ""}
                address={currentEntityId ? getEntityAddress(currentEntityId) : ""}
                founded={currentEntityId ? getEntityFounded(currentEntityId) : 0}
                logo={currentEntityId ? getEntityLogo(currentEntityId) || "" : ""}
                countries={currentEntityId ? getEntityCountries(currentEntityId) : []}
                entityId={currentEntityId || ""}
                email={currentEntityId ? getEntityEmail(currentEntityId) : ""}
                twitter={currentEntityId ? getEntityTwitter(currentEntityId) : ""}
                telegram={currentEntityId ? getEntityTelegram(currentEntityId) : ""}
                ensAddress={currentEntityId ? getEntityEnsAddress(currentEntityId) : ""}
                legalInfoUrl={currentEntityId ? getEntityLegalInfoUrl(currentEntityId) : ""}
                ceo={currentEntityId ? getEntityCeo(currentEntityId) : ""}
                keyPersonnel={currentEntityId ? getEntityKeyPersonnel(currentEntityId) : ""}
                ticker={currentEntityId ? getEntityTicker(currentEntityId) : ""}
                parentId={currentEntityId ? getEntityParentId(currentEntityId) : ""}
                entityTags={currentEntityId ? getEntityTags(currentEntityId) : []}
                socialMediaProfiles={currentEntityId ? getEntitySocialMediaProfiles(currentEntityId) : []}
                isCentralized={currentEntityId ? getEntityIsCentralized(currentEntityId) : undefined}
                noKycRequired={currentEntityId ? getEntityNoKycRequired(currentEntityId) : false}
                isDead={currentEntityId ? getEntityIsDead(currentEntityId) : false}
                isOfacSanctioned={currentEntityId ? getEntityIsOfacSanctioned(currentEntityId) : false}
                note={currentEntityId ? getEntityNote(currentEntityId) : ""}
                lastUpdated={currentEntityId ? getEntityLastUpdated(currentEntityId) : ""}
                lastModifiedBy={currentEntityId ? getEntityLastModifiedBy(currentEntityId) : ""}
                revisitSite={currentEntityId ? getEntityRevisitSite(currentEntityId) : false}
                showToggle={showToggle}
                isBeneficialOwner={isBeneficialOwner}
                onToggle={setIsBeneficialOwner}
                custodialEntityName={custodialEntityName}
                beneficialOwnerName={beneficialOwnerName}
              />
            </div>
            
            <div 
              className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700" 
              style={maxEntityHeight > 0 ? { height: maxEntityHeight } : (entityDetailsHeight ? { height: Math.max(entityDetailsHeight, 500) } : { minHeight: '500px' })}
            >
              <SocialMediaFeed 
                address={address}
                title="Social Media & News Feed"
              />
            </div>
          </div>

      {/* Geographic Presence - Full Width */}
      {currentEntityId && getEntityCountries(currentEntityId).length > 0 && (
        <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
          <GeographicPresence
            countries={getEntityCountries(currentEntityId)}
          />
        </div>
      )}

          {/* Notes Section - Full Width */}
          {address && (
            <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-background border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <StickyNote className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Address Notes</h2>
              </div>
              <NotesPanel 
                type="address"
                address={address}
                inline={true}
              />
            </div>
          )}
        </div>
      )}

      {false && (loading || isLoadingAnyData) && (
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
    </ViewWrapper>
  );
});

RiskDashboard.displayName = 'RiskDashboard';

export default RiskDashboard;
