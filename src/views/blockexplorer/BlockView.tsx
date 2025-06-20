import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { BsBlock } from '../../styles/Table';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { useTheme } from '../../context/ThemeContext';
import { useAttribution } from '../../context/AttributionContext';
import Pagination from '../../components/common/Pagination';
import { Tooltip } from 'antd';
import { IBtcBlock } from '../../typings/Block';
import {
  BlockLayout,
  ScrollableContent,
  ErrorMessage,
  BlockSummaryCard,
  Row,
  Label,
  Value,
  CopyButton,
  CopyAlert,
  StickyBlockHashCard,
  styles
} from './styles/BlockView.styles';
import { truncateStringMiddle } from '../../utils/generic';

const BlockView: React.FC = () => {
  const { block } = useParams();
  const { theme } = useTheme();
  const [blockData, setBlockData] = useState<IBtcBlock | null>(null);
  const [transactions, setTransactions] = useState<BtcTransaction[]>([]);
  const [totalTxs, setTotalTxs] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchAttributions } = useAttribution();
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <ErrorMessage theme={{ theme }}>{error}</ErrorMessage>;
  if (!blockData) return <ErrorMessage theme={{ theme }}>Block not found</ErrorMessage>;

  return (
    <BlockLayout>
      <StickyBlockHashCard theme={{ theme }}>
        <h2 style={styles.blockHashTitle}>Block Hash</h2>
        <div style={styles.blockHashContainer}>
          <CopyButton onClick={() => copyToClipboard(blockData.hash)} title="Copy block hash">
            {copied ? '✓' : '⧉'}
          </CopyButton>
          <Value style={styles.blockHashValue}>
            <span style={{ fontFamily: 'monospace', color: '#fff' }}>{blockData.hash}</span>
          </Value>
          {copied && <CopyAlert theme={{ theme }}>Block hash copied</CopyAlert>}
        </div>
      </StickyBlockHashCard>
      <ScrollableContent>
        <BlockSummaryCard theme={{ theme }}>
          <h2 style={styles.summaryTitle}>Summary</h2>
          <hr style={styles.summaryDivider} />
          <div style={styles.summaryGrid}>
            {/* Left column */}
            <div style={styles.column}>
              <Row><Label>Block Height</Label><Value>{blockData.number}</Value></Row>
              <Row><Label>Block Size</Label><Value>{blockData.size} bytes</Value></Row>
              <Row><Label>Stripped Size</Label><Value>{blockData.stripped_size}</Value></Row>
              <Row><Label>Weight</Label><Value>{blockData.weight}</Value></Row>
              <Row><Label>Time</Label><Value>{new Date((blockData.timestamp)).toLocaleString()}</Value></Row>
              <Row><Label>Txn Count</Label><Value>{blockData.transaction_count}</Value></Row>
            </div>
            {/* Right column */}
            <div style={styles.columnRight}>
              <Row><Label>Version</Label><Value>{blockData.version}</Value></Row>
              <Row><Label>Bits</Label><Value>{blockData.bits}</Value></Row>
              <Row><Label>Nonce</Label><Value>{blockData.nonce}</Value></Row>
              <Row><Label>Coinbase Param</Label><Value><Tooltip title={blockData.coinbase_param}>{truncateStringMiddle(blockData.coinbase_param || '', 18)}</Tooltip></Value></Row>
              <Row><Label>Merkle Root</Label><Value><span style={{ fontFamily: 'monospace', color: '#fff' }}>{blockData.merkle_root}</span></Value></Row>
            </div>
          </div>
        </BlockSummaryCard>
        <BsBlock className="font-mono">
          <h3>Transactions ({totalTxs})</h3>
          <hr />
        </BsBlock>
        <div>
          {isLoading ? (
            <div style={styles.loadingContainer}>Loading...</div>
          ) : (
            <>
              {transactions.map(tx => <BtcTransactionTable key={tx._id} transaction={tx} theme={{ theme }} />)}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </ScrollableContent>
    </BlockLayout>
  );
};

export default BlockView; 