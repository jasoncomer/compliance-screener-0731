import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { api } from '../../api/api';
import Pagination from '../../components/common/Pagination';
import { BlockLoader } from '../../components/ui/blockchain-loader';
import { useAttribution } from '../../context/AttributionContext';
import { useToast } from '../../hooks/use-toast';
import { IBtcBlock } from '../../typings/Block';
import { BtcTransaction } from '../../typings/BtcTransaction';

import BtcTransactionTable from './transaction/BtcTransactionTable';
import BlockSummary from './BlockSummary';

const BlockView: React.FC = () => {
  const { block } = useParams();
  const { toast } = useToast();
  const [blockData, setBlockData] = useState<IBtcBlock | null>(null);
  const [transactions, setTransactions] = useState<BtcTransaction[]>([]);
  const [totalTxs, setTotalTxs] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchAttributions } = useAttribution();
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const fetchBlock = async () => {
      if (!block) {
        setError('No block number provided');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const blockNumber = Number(block);
        if (isNaN(blockNumber)) {
          throw new Error('Invalid block number');
        }
        const response = await api.blockchain.getBlock(blockNumber);
        if (!response) {
          throw new Error('No data received from the server');
        }
        setBlockData(response);
      } catch (error) {
        console.error('Error fetching block:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch block data');
        setBlockData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlock();
  }, [block]);

  useEffect(() => {
    const fetchBlockTransactions = async () => {
      if (!blockData) return;
      try {
        setIsLoading(true);
        const { txs, pagination } = await api.blockchain.getBlockTransactions(blockData.number, {
          page: currentPage,
          limit: itemsPerPage
        });
        setTransactions(txs);
        setTotalTxs(pagination.totalTxs);
        // Fetch attributions for all addresses in these transactions
        const uniqueAddresses = new Set<string>(
          txs.flatMap((tx: BtcTransaction) => [
            ...tx.inputs.map((input: { addr: string }) => input.addr),
            ...tx.outputs.map((output: { addr: string }) => output.addr)
          ])
        );
        fetchAttributions(Array.from(uniqueAddresses));
      } catch (error) {
        console.error('Error fetching block transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlockTransactions();
  }, [blockData, currentPage, fetchAttributions]);

  const totalPages = Math.ceil(totalTxs / itemsPerPage);
  const handlePageChange = (page: number) => setCurrentPage(page);

  const copyToClipboard = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!blockData?.hash) return;
    
    navigator.clipboard.writeText(blockData.hash)
      .then(() => {
        setCopySuccess(true);
        toast({
          title: "Block hash copied",
          description: "The block hash has been copied to your clipboard.",
        });
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy block hash: ', err);
        toast({
          title: "Copy failed",
          description: "Failed to copy block hash to clipboard.",
          variant: "destructive",
        });
      });
  };

  if (isLoading && !blockData) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <BlockLoader blockNumber={block ? Number(block) : undefined} />
    </div>
  );
  if (error) return <div className="text-red-500 p-4 text-center">{error}</div>;
  if (!blockData) return <div className="text-red-500 p-4 text-center">Block not found</div>;

  return (
    <div className="flex flex-col w-full">
      <BlockSummary
        block={blockData}
        copySuccess={copySuccess}
        onCopyClick={copyToClipboard}
      />
      
      <div className="w-full">
  
          <h3 className="py-2">Transactions ({totalTxs.toLocaleString()})</h3>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <BlockLoader blockNumber={blockData.number} />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {transactions.map((tx: BtcTransaction) => <BtcTransactionTable key={tx._id} transaction={tx} />)}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
      </div>
    </div>
  );
};

export default BlockView; 