import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../../api/api';
import { flowtraceService } from '../../../services/flowtraceService';
import { BsBlock } from '../../../styles/Table';
import { IBtcAddress } from '../../../typings/BtcAddress';
import BtcTransactionTable from '../transaction/BtcTransactionTable';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { useAttribution } from '../../../context/AttributionContext';
import Pagination from '../../../components/common/Pagination';
import { getTagColor } from '../../../utils/tag-colors';
import { calculateRiskScore } from '../../../api/riskScoring';
import { RiskScoringResponse } from '../../../typings/riskScoring';
import AddressSummary from './AddressSummary';
import AddressNotFound from './AddressNotFound';
import AddressLoading from './AddressLoading';
import { useToast } from '../../../hooks/use-toast';
import RiskScoreModal from '../../RiskDashboard/components/risk-analysis/RiskScoreModal';

import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { RootState } from '../../../store/store';
import { fetchSOT } from '../../../store/slices/sotSlice';

const Address: React.FC = () => {
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [addrData, setAddrData] = React.useState<IBtcAddress>();
  const [txs, setTxs] = React.useState<BtcTransaction[]>([]);
  const [totalTxs, setTotalTxs] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isLoadingAddressData, setIsLoadingAddressData] = React.useState<boolean>(false);
  const [isLoadingRiskScore, setIsLoadingRiskScore] = React.useState<boolean>(false);
  const [copySuccess, setCopySuccess] = React.useState<boolean>(false);
  const [riskScore, setRiskScore] = React.useState<RiskScoringResponse | null>(null);
  const [isRiskModalVisible, setIsRiskModalVisible] = React.useState<boolean>(false);
  const [addressNotFound, setAddressNotFound] = React.useState<boolean>(false);
  
  // Get date filter from URL parameters
  const dateFilter = searchParams.get('date');

  const itemsPerPage = 20;
  const { fetchAttributions, attributions } = useAttribution();
  const { itemsMap } = useAppSelector((state: RootState) => state.sot);

  const [summary, setSummary] = React.useState<{
    balance: number;
    total_received: number;
    total_spent: number;
  }>({
    balance: 0,
    total_received: 0,
    total_spent: 0
  });
  const [blockStats, setBlockStats] = React.useState<{
    totalBlocks: number;
    firstBlock: {
      blockNumber: number;
      transactionCount: number;
      totalValue: number;
    } | null;
    lastBlock: {
      blockNumber: number;
      transactionCount: number;
      totalValue: number;
    } | null;
  }>({
    totalBlocks: 0,
    firstBlock: null,
    lastBlock: null
  });
  const totalPages = Math.ceil(totalTxs / itemsPerPage);

  useEffect(() => {
    // Fetch SOT data when component mounts
    dispatch(fetchSOT());
  }, [dispatch]);

  useEffect(() => {
    const getAddressStats = async () => {
      if (!address) return;
      const blockStatsData = await api.blockchain.getAddressBlockStats(address);
      setBlockStats(blockStatsData);
    };
    
    const fetchAddress = async () => {
      try {
        if (!address) return;
        setIsLoading(true);
        setIsLoadingAddressData(true);
        setAddressNotFound(false);
        
        // First try to get address data to check if address exists
        const { data } = await api.blockchain.getAddress(address);
        
        // Check if we got valid address data
        if (!data || !data.addr) {
          setAddressNotFound(true);
          return;
        }
        
        setAddrData(data);
        
        // Try to get address stats, but don't fail if it doesn't exist
        try {
          await getAddressStats();
        } catch (statsError) {
          console.error('Error fetching address stats:', statsError);
          // Don't throw here, just log the error and continue
        }
        
        let txs: BtcTransaction[] = [];
        let pagination: { totalTxs: number; totalPages: number; currentPage: number; limit: number };
        
        if (dateFilter) {
          // If date filter is applied, fetch all transactions to find all for that date
          const allTransactionsResponse = await flowtraceService.fetchAllTransactions(address, 1000);
          txs = allTransactionsResponse.txs || [];
          pagination = {
            totalTxs: allTransactionsResponse.total || txs.length,
            totalPages: 1,
            currentPage: 1,
            limit: txs.length
          };
        } else {
          // Normal pagination for regular view
          const response = await api.blockchain.getAddressTransactions(address, {
            page: currentPage,
            limit: itemsPerPage
          });
          txs = response.txs;
          pagination = response.pagination;
        }
        
        // Filter transactions by date if date filter is provided
        let filteredTxs = txs;
        let filteredTotalTxs = pagination.totalTxs;
        
        if (dateFilter) {
          // Parse the date filter in local timezone to avoid timezone shift
          const [year, month, day] = dateFilter.split('-').map(Number);
          const filterDate = new Date(year, month - 1, day); // month is 0-indexed
          
          filteredTxs = txs.filter(tx => {
            const txDate = new Date(tx.timestamp * 1000);
            const txDateLocal = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
            
            const isInRange = txDateLocal.getTime() === filterDate.getTime();
            
            return isInRange;
          });
          filteredTotalTxs = filteredTxs.length;
        }
        
        setTxs(filteredTxs);
        setTotalTxs(filteredTotalTxs);
        const uniqueAddresses = new Set([
          address,
          ...txs.flatMap(tx => tx.inputs.map(i => i.addr)),
          ...txs.flatMap(tx => tx.outputs.map(o => o.addr))
        ]);
        fetchAttributions(Array.from(uniqueAddresses));

        // get total received and spent and balance
        try {
          const tmpSummary = await api.blockchain.getAddressSummary(address);
          if (tmpSummary) {
            setSummary({
              balance: tmpSummary.balance || 0,
              total_received: tmpSummary.total_received || 0,
              total_spent: tmpSummary.total_spent || 0
            });
          }
        } catch (summaryError) {
          console.error('Error fetching address summary:', summaryError);
          // Set default values if summary fails
          setSummary({
            balance: 0,
            total_received: 0,
            total_spent: 0
          });
        }
      } catch (error: any) {
        console.error('Error fetching address data:', error);
        
        // Check if it's a 404 or address not found error
        if (error?.response?.status === 404 || 
            error?.response?.data?.message?.toLowerCase().includes('not found') ||
            error?.response?.data?.message?.toLowerCase().includes('address not found') ||
            error?.message?.toLowerCase().includes('cannot read properties of undefined') ||
            error?.message?.toLowerCase().includes('balance')) {
          setAddressNotFound(true);
        }
      } finally {
        setIsLoadingAddressData(false);
      }
    };

    fetchAddress();
  }, [address, currentPage, fetchAttributions, dateFilter]);

  useEffect(() => {
    const fetchRiskScore = async () => {
      if (!address) return;
      try {
        setIsLoadingRiskScore(true);
        const scores = await calculateRiskScore(address, 'address');
        
        // Apply BO override logic if attribution data is available
        if (attributions[address] && Object.keys(itemsMap).length > 0) {
          const attribution = attributions[address];
          
          if (attribution.bo && attribution.bo !== attribution.entity) {
            const entitySOT = itemsMap[attribution.entity];
            const beneficialOwnerSOT = itemsMap[attribution.bo];
            
            if (beneficialOwnerSOT) {
              // Import the BO override function
              const { applyBeneficialOwnerOverride } = await import('../../../utils/entityUtils');
              
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
                scores.riskScores,
                address
              );
              
              // Update the risk score with BO override
              if (override.riskScore !== undefined) {
                scores.overallRisk = override.riskScore / 100; // Convert back to 0-1 range
              }
              
              // Add BO information to the response for display
              scores.boInfo = {
                entityName: override.entityName,
                entityType: override.entityType,
                entityTags: override.entityTags,
                ofac: override.ofac,
                isBeneficialOwnerOverride: override.isBeneficialOwnerOverride
              };
            }
          }
        }
        
        setRiskScore(scores);
      } catch (error) {
        console.error('Error fetching risk score:', error);
      } finally {
        setIsLoadingRiskScore(false);
        // Only set main loading to false when both address data and risk score are complete
        setIsLoading(false);
      }
    };

    // Only fetch risk score when address, attributions, and itemsMap are available
    if (address && Object.keys(attributions).length > 0 && Object.keys(itemsMap).length > 0) {
      fetchRiskScore();
    } else if (address && !isLoadingAddressData) {
      // If we can't fetch risk score but address data is loaded, set loading to false
      setIsLoading(false);
    }
  }, [address, attributions, itemsMap]);

  // Handle case where address data is loaded but risk score can't be fetched
  useEffect(() => {
    if (address && !isLoadingAddressData && !isLoadingRiskScore && 
        (Object.keys(attributions).length === 0 || Object.keys(itemsMap).length === 0)) {
      setIsLoading(false);
    }
  }, [address, isLoadingAddressData, isLoadingRiskScore, attributions, itemsMap]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRiskScoreClick = () => {
    setIsRiskModalVisible(true);
  };

  // Function to get entity tags
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

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!address) return;
    
    navigator.clipboard.writeText(address)
      .then(() => {
        setCopySuccess(true);
        toast({
          title: "Address copied",
          description: "The address has been copied to your clipboard.",
        });
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy address: ', err);
        toast({
          title: "Copy failed",
          description: "Failed to copy address to clipboard.",
          variant: "destructive",
        });
      });
  };

  const formatDateFilter = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const filterDate = new Date(year, month - 1, day);
    return filterDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const clearDateFilter = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('date');
    window.history.replaceState({}, '', url.toString());
    window.location.reload();
  };

  const renderDateFilterIndicator = () => {
    if (!dateFilter) return null;

    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              📅 Filtered by date:
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {formatDateFilter(dateFilter)}
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

  // Show loading state while fetching data
  if (isLoading) {
    return <AddressLoading address={address || ''} />;
  }

  // Show not found state if address was not found
  if (addressNotFound) {
    return <AddressNotFound address={address || ''} />;
  }

  return (
    <div className="flex flex-col w-full">
      <AddressSummary
        address={address}
        summary={summary}
        blockStats={blockStats}
        addrData={addrData}
        riskScore={riskScore}
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
        <BsBlock>

          <h3>
            Transactions ({totalTxs.toLocaleString()})
            {dateFilter && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                (filtered)
              </span>
            )}
          </h3>
          <hr />
          {txs.map(tx => <BtcTransactionTable key={tx._id} transaction={tx} />)}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </BsBlock>
      </div>
      
      {/* Risk Score Modal */}
      <RiskScoreModal
        visible={isRiskModalVisible}
        onClose={() => setIsRiskModalVisible(false)}
        riskScores={riskScore}
        address={address || ''}
        loading={isLoadingRiskScore}
      />
    </div>
  );
};

export default Address;