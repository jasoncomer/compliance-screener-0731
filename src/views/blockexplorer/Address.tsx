import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { BsBlock } from '../../styles/Table';
import { IBtcAddress } from '../../typings/BtcAddress';
import { BsWrapper } from '../../styles/ocmmon';
import styled from 'styled-components';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BtcTransaction } from '../../typings/BtcTransaction';

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
  const [addrData, setAddrData] = React.useState<IBtcAddress>();
  const [txs, setTxs] = React.useState<BtcTransaction[]>([]);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (!address) return;
        const { data, txData } = await api.blockchain.getAddress(address);
        setAddrData(data);
        setTxs(txData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchAddress();
  }, [address]);

  return (
    <>
      <BsWrapper>
        <BsBlock>
          <h3>Address</h3>
          <hr />
          <div>
            {address}
          </div>
        </BsBlock>

        <BsBlock>
          <h3>Summary</h3>
          <hr />
          <SummaryWrapper>
            <div className='col'>
              <span><strong>Balance:</strong> {addrData?.balance} BTC</span>
              <span><strong>First block:</strong> {addrData?.first_block?.toLocaleString()}</span>
              <span><strong>Last block:</strong> {addrData?.last_block?.toLocaleString()}</span>
            </div>

            <div className='col'>
              <span><strong>Total Received:</strong> {addrData?.script_type}</span>
              <span><strong>Multisig:</strong> {addrData?.multisig}</span>
            </div>
          </SummaryWrapper>
        </BsBlock>

        <BsBlock>
          <h3>Transactions ({txs.length.toLocaleString()})</h3>
          <hr />
          {txs.map(tx => <BtcTransactionTable transaction={tx} />)}
        </BsBlock>
      </BsWrapper>
    </>
  );
};

export default Address;