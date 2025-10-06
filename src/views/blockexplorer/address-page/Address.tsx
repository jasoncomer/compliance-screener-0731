import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import Pagination from '../../../components/common/Pagination';
import { AddressLoader } from '../../../components/ui/blockchain-loader';
import { useAttribution } from '../../../context/AttributionContext';
import { useToast } from '../../../hooks/use-toast';
import { useAddress } from '../../../hooks/useAddress';
import { useAddressBlockStats } from '../../../hooks/useAddressBlockStats';
import { useAddressSummary } from '../../../hooks/useAddressSummary';
import { useAddressTransactions } from '../../../hooks/useAddressTransactions';
import { useRiskScore } from '../../../hooks/useRiskScore';
import { flowtraceService } from '../../../services/flowtraceService';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchSOT } from '../../../store/slices/sotSlice';
import { RootState } from '../../../store/store';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { getTagColor } from '../../../utils/tag-colors';
import RiskScoreModal from '../../RiskDashboard/components/risk-analysis/RiskScoreModal';
import BtcTransactionTable from '../transaction/BtcTransactionTable';

import AddressNotFound from './AddressNotFound';
import AddressSummary from './AddressSummary';

const Address: React.FC = () => {
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  // UI State
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [copySuccess, setCopySuccess] = React.useState<boolean>(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRiskModalVisible, setIsRiskModalVisible] = React.useState<boolean>(false);
  const [dateFilteredTxs, setDateFilteredTxs] = React.useState<BtcTransaction[]>([]);
  const [dateFilteredTotal, setDateFilteredTotal] = React.useState<number>(0);

  // Get date filter from URL parameters
  const dateFilter = searchParams.get('date');
  const itemsPerPage = 20;

  // Context and Redux
  const { fetchAttributions, attributions } = useAttribution();
  const { itemsMap } = useAppSelector((state: RootState) => state.sot);

  // React Query Hooks
  const { data: addrData, isLoading: isLoadingAddress, error: addressError } = useAddress(address || '');
  const { data: blockStats } = useAddressBlockStats(address || '');
  const { data: summary } = useAddressSummary(address || '');
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions
  } = useAddressTransactions(address || '', currentPage, itemsPerPage);
  const { riskScore, isLoading: isLoadingRiskScore } = useRiskScore(address || '');

  // Calculate derived values with memoization to fix ESLint warning
  const txs = useMemo(
    () => dateFilter ? dateFilteredTxs : (transactionsData?.txs || []),
    [dateFilter, dateFilteredTxs, transactionsData?.txs]
  );
  const totalTxs = dateFilter ? dateFilteredTotal : (transactionsData?.pagination?.totalTxs || 0);
  const totalPages = Math.ceil(totalTxs / itemsPerPage);

  // Check for address not found
  const addressNotFound = !isLoadingAddress && (addressError || (!addrData && address));

  // Show initial loading only while fetching critical address data
  const showInitialLoader = isLoadingAddress && !addrData;

  // Fetch SOT data when component mounts
  useEffect(() => {
    dispatch(fetchSOT());
  }, [dispatch]);

  // Cleanup copy timeout on unmount or address change
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    };
  }, [address]);

  // Handle date filtering
  useEffect(() => {
    const fetchDateFilteredTransactions = async () => {
      if (!address || !dateFilter) {
        setDateFilteredTxs([]);
        setDateFilteredTotal(0);
        return;
      }

      try {
        // Fetch all transactions for date filtering
        const allTransactionsResponse = await flowtraceService.fetchAllTransactions(address, 1000);
        const allTxs = allTransactionsResponse.txs || [];

        // Parse date in UTC to ensure consistent filtering
        const [year, month, day] = dateFilter.split('-').map(Number);
        const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

        const filtered = allTxs.filter(tx => {
          const txTime = tx.timestamp * 1000;
          return txTime >= startOfDay.getTime() && txTime <= endOfDay.getTime();
        });

        setDateFilteredTxs(filtered);
        setDateFilteredTotal(filtered.length);
      } catch (error) {
        console.error('Error fetching date-filtered transactions:', error);
        setDateFilteredTxs([]);
        setDateFilteredTotal(0);
      }
    };

    if (dateFilter) {
      fetchDateFilteredTransactions();
    }
  }, [address, dateFilter]);

  // Fetch attributions for visible transactions only
  useEffect(() => {
    if (!address || txs.length === 0) return;

    // Only fetch attributions for addresses visible on current page
    const visibleAddresses = new Set<string>();

    // Add current address
    if (address) visibleAddresses.add(address);

    // Add addresses from visible transactions (limit to current page)
    const pageTransactions = txs.slice(0, itemsPerPage);
    pageTransactions.forEach(tx => {
      tx.inputs.forEach(input => {
        if (input.addr) visibleAddresses.add(input.addr);
      });
      tx.outputs.forEach(output => {
        if (output.addr) visibleAddresses.add(output.addr);
      });
    });

    fetchAttributions(Array.from(visibleAddresses));
  }, [address, txs, fetchAttributions]);

  // Apply BO override to risk score if needed
  const getRiskScoreWithOverride = useCallback(async () => {
    if (!riskScore || !address || !attributions[address] || Object.keys(itemsMap).length === 0) {
      return riskScore;
    }

    const attribution = attributions[address];
    if (!attribution.bo || attribution.bo === attribution.entity) {
      return riskScore;
    }

    const entitySOT = itemsMap[attribution.entity];
    const beneficialOwnerSOT = itemsMap[attribution.bo];

    if (!beneficialOwnerSOT) {
      return riskScore;
    }

    try {
      const { applyBeneficialOwnerOverride } = await import('../../../utils/entityUtils');

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

      const updatedScore = { ...riskScore };
      if (override.riskScore !== undefined) {
        updatedScore.overallRisk = override.riskScore / 100;
      }

      updatedScore.boInfo = {
        entityName: override.entityName,
        entityType: override.entityType,
        entityTags: override.entityTags,
        ofac: override.ofac,
        isBeneficialOwnerOverride: override.isBeneficialOwnerOverride
      };

      return updatedScore;
    } catch (error) {
      console.error('Error applying BO override:', error);
      return riskScore;
    }
  }, [riskScore, address, attributions, itemsMap]);

  // Use the processed risk score with BO override
  const [processedRiskScore, setProcessedRiskScore] = React.useState(riskScore);

  useEffect(() => {
    getRiskScoreWithOverride().then(setProcessedRiskScore);
  }, [getRiskScoreWithOverride]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  const handleRiskScoreClick = useCallback(() => {
    setIsRiskModalVisible(true);
  }, []);

  // Memoized function to get entity tags
  const getEntityTags = useCallback((entityId: string): string[] => {
    if (!entityId) return [];
    const entity = Object.values(itemsMap).find(sot => sot.entity_id === entityId);
    const tags: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const tag = entity?.[`entity_tag${i}` as keyof typeof entity];
      if (tag && typeof tag === 'string') {
        tags.push(tag);
      }
    }
    return tags;
  }, [itemsMap]);

  const copyToClipboard = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!address) return;

    // Clear any existing timeout
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }

    navigator.clipboard.writeText(address)
      .then(() => {
        setCopySuccess(true);
        toast({
          title: "Address copied",
          description: "The address has been copied to your clipboard.",
        });
        copyTimeoutRef.current = setTimeout(() => {
          setCopySuccess(false);
          copyTimeoutRef.current = null;
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy address: ', err);
        toast({
          title: "Copy failed",
          description: "Failed to copy address to clipboard.",
          variant: "destructive",
        });
      });
  }, [address, toast]);

  const formatDateFilter = useMemo(() => {
    if (!dateFilter) return '';
    const [year, month, day] = dateFilter.split('-').map(Number);
    const filterDate = new Date(Date.UTC(year, month - 1, day));
    return filterDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }, [dateFilter]);

  const clearDateFilter = useCallback(() => {
    navigate(`/blockchain/address/${address}`, { replace: true });
  }, [navigate, address]);

  const renderDateFilterIndicator = () => {
    if (!dateFilter) return null;

    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Filtered by date:
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {formatDateFilter}
            </span>
          </div>
          <button
            onClick={clearDateFilter}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
          >
            Clear filter
          </button>
        </div>
      </div>
    );
  };

  // Show loading state only for initial address fetch
  if (showInitialLoader) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <AddressLoader address={address || ''} />
      </div>
    );
  }

  // Show not found state if address was not found
  if (addressNotFound) {
    return <AddressNotFound address={address || ''} />;
  }

  return (
    <div className="flex flex-col w-full">
      <AddressSummary
        address={address}
        summary={summary ? {
          balance: summary.balance || 0,
          total_received: summary.total_received || 0,
          total_spent: summary.total_spent || 0
        } : {
          balance: 0,
          total_received: 0,
          total_spent: 0
        }}
        blockStats={blockStats || {
          totalBlocks: 0,
          firstBlock: null,
          lastBlock: null
        }}
        addrData={addrData}
        riskScore={processedRiskScore || riskScore}
        isLoadingRiskScore={isLoadingRiskScore}
        onRiskScoreClick={handleRiskScoreClick}
        copySuccess={copySuccess}
        onCopyClick={copyToClipboard}
        attributions={attributions}
        getEntityTags={getEntityTags}
        getTagColor={getTagColor}
        itemsMap={itemsMap}
      />

      {/* Date Filter Indicator */}
      {renderDateFilterIndicator()}

      <div className="w-full">
        <h3 className="py-2">
          Transactions ({totalTxs.toLocaleString()})
          {dateFilter && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              (filtered)
            </span>
          )}
          {isLoadingTransactions && !dateFilter && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              Loading...
            </span>
          )}
        </h3>
        
        {isLoadingTransactions && !dateFilter ? (
          // Show loading skeleton while transactions are loading
          <div className="space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          // Show transactions when loaded
          <>
            <div className="space-y-4">
              {txs.map(tx => <BtcTransactionTable key={tx._id} transaction={tx} />)}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* Risk Score Modal */}
      <RiskScoreModal
        visible={isRiskModalVisible}
        onClose={() => setIsRiskModalVisible(false)}
        riskScores={processedRiskScore || riskScore}
        address={address || ''}
        loading={isLoadingRiskScore}
      />
    </div>
  );
};

export default Address;