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
import { useToast } from '../../../hooks/use-toast';

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
  const [copySuccess, setCopySuccess] = React.useState<boolean>(false);
  const [riskScore, setRiskScore] = React.useState<RiskScoringResponse | null>(null);
  const [isLoadingRiskScore, setIsLoadingRiskScore] = React.useState<boolean>(false);
  
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
        await getAddressStats();
        
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
        
        const { data } = await api.blockchain.getAddress(address);
        setAddrData(data);
        
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
        const tmpSummary = await api.blockchain.getAddressSummary(address);
        setSummary({
          balance: tmpSummary.balance,
          total_received: tmpSummary.total_received,
          total_spent: tmpSummary.total_spent
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
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
        setRiskScore(scores);
      } catch (error) {
        console.error('Error fetching risk score:', error);
      } finally {
        setIsLoadingRiskScore(false);
      }
    };

    fetchRiskScore();
  }, [address]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleRiskScoreClick = () => {
    window.open(`/home/risk-dashboard?address=${address}`, '_blank');
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
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
          ) : (
            <>
              {txs.map(tx => <BtcTransactionTable key={tx._id} transaction={tx} />)}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </BsBlock>
      </div>
    </div>
  );
};

export default Address;