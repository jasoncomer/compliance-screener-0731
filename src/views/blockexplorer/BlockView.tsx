import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { BsBlock } from '../../styles/Table';
import styled from 'styled-components';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { useTheme } from '../../context/ThemeContext';
import { useAttribution } from '../../context/AttributionContext';

const BlockLayout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const ScrollableContent = styled.div`
  flex: 1;
  width: 100%;
  overflow-y: auto;
  padding-top: 20px;

  > :first-child {
    margin-top: 0;
  }
`;

const SummaryWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  font-family: monospace;
  font-size: 16px;
  .col {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 10px;
    
    span {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  padding: 20px;
  text-align: center;
  background: ${props => props.theme.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  border-radius: 4px;
  margin: 20px 0;
`;

interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  size: number;
  weight: number;
  version: number;
  merkle_root: string;
  nonce: number;
  bits: string;
  transactions: BtcTransaction[];
}

const BlockView: React.FC = () => {
  const { block } = useParams();
  const { theme } = useTheme();
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchAttributions } = useAttribution();

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

        // Only process transactions if they exist
        if (response.transactions && Array.isArray(response.transactions)) {
          // Extract all unique addresses from transactions
          const uniqueAddresses = new Set<string>(
            response.transactions.flatMap((tx: BtcTransaction) => [
              ...tx.inputs.map((input: { addr: string }) => input.addr),
              ...tx.outputs.map((output: { addr: string }) => output.addr)
            ])
          );

          // Fetch attributions for all addresses
          fetchAttributions(Array.from(uniqueAddresses));
        } else {
          console.warn('No transactions found in block data:', response);
        }
      } catch (error) {
        console.error('Error fetching block:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch block data');
        setBlockData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlock();
  }, [block, fetchAttributions]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <ErrorMessage theme={{ theme }}>{error}</ErrorMessage>;
  if (!blockData) return <ErrorMessage theme={{ theme }}>Block not found</ErrorMessage>;

  return (
    <BlockLayout>
      <ScrollableContent>
        <BsBlock theme={{ theme }}>
          <h3>Block Information</h3>
          <hr />
          <SummaryWrapper>
            <div className='col'>
              <span><strong>Hash:</strong> { blockData.hash}</span>
              <span><strong>Height:</strong>  {blockData.height}</span>
              <span><strong>Timestamp:</strong>  {new Date(blockData.timestamp * 1000).toLocaleString()}</span>
            </div>
           
          </SummaryWrapper>
        </BsBlock>

        <BsBlock theme={{ theme }}>
          <h3>Transactions ({blockData.transactions.length})</h3>
          <hr />
          {blockData.transactions.map(tx => (
            <BtcTransactionTable key={tx._id} transaction={tx} theme={{ theme }} />
          ))}
        </BsBlock>
      </ScrollableContent>
    </BlockLayout>
  );
};

export default BlockView; 