import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { BsBlock } from '../../styles/Table';
import { IBtcAddress } from '../../typings/BtcAddress';
import { BsWrapper } from '../../styles/ocmmon';
import styled from 'styled-components';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { satsToBTC } from '../../utils/crypto';
import { useAttribution } from '../../context/AttributionContext';
import Pagination from '../../components/common/Pagination';
import { useTheme } from '../../context/ThemeContext';

const SummaryWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;

  .col {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 10px;
    
    span {
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
    }
  }
`;

const Address: React.FC = () => {
  const { address } = useParams();
  const { theme } = useTheme();
  const [addrData, setAddrData] = React.useState<IBtcAddress>();
  const [txs, setTxs] = React.useState<BtcTransaction[]>([]);
  const [totalTxs, setTotalTxs] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const itemsPerPage = 20;
  const { fetchAttributions } = useAttribution();
  const [summary, setSummary] = React.useState<{
    balance: number;
    total_received: number;
    total_spent: number;
  }>({
    balance: 0,
    total_received: 0,
    total_spent: 0
  });
  const totalPages = Math.ceil(totalTxs / itemsPerPage);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (!address) return;
        setIsLoading(true);
        const [{ data }, { txs, pagination }] = await Promise.all([
          api.blockchain.getAddress(address),
          api.blockchain.getAddressTransactions(address, {
            page: currentPage,
            limit: itemsPerPage
          })
        ]);
        setAddrData(data);
        setTxs(txs);
        setTotalTxs(pagination.totalTxs);
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
  }, [address, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      <BsWrapper>
        <BsBlock theme={{ theme }}>
          <h3>Address</h3>
          <hr />
          <div>
            {address}
          </div>
        </BsBlock>

        <BsBlock theme={{ theme }}>
          <h3>Summary</h3>
          <hr />
          <SummaryWrapper>
            <div className='col'>
              <span><strong>Balance:</strong> {satsToBTC(summary?.balance || 0)} BTC</span>
              <span><strong>First block:</strong> {addrData?.first_block?.toLocaleString()}</span>
              <span><strong>Last block:</strong> {addrData?.last_block?.toLocaleString()}</span>
            </div>

            <div className='col'>
              <span><strong>Script Type:</strong> {addrData?.script_type}</span>
              <span><strong>Total received:</strong> {satsToBTC(summary?.total_received || 0)} BTC</span>
              <span><strong>Total spent:</strong> {satsToBTC(summary?.total_spent || 0)} BTC</span>
            </div>
          </SummaryWrapper>
        </BsBlock>

        <BsBlock theme={{ theme }}>
          <h3>Transactions ({totalTxs.toLocaleString()})</h3>
          <hr />
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
          ) : (
            <>
              {txs.map(tx => <BtcTransactionTable key={tx._id} transaction={tx} theme={{ theme }} />)}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </BsBlock>
      </BsWrapper>
    </>
  );
};

export default Address;