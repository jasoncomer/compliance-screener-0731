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
  const [totalTxs, setTotalTxs] = React.useState<number>(0);
  const { fetchAttributions } = useAttribution();

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (!address) return;
        const [{ data }, { txs, pagination }] = await Promise.all([
          api.blockchain.getAddress(address),
          api.blockchain.getAddressTransactions(address)
        ]);
        setAddrData(data);
        setTxs(txs);
        setTotalTxs(pagination.totalTxs);
        const addresses = [
          address,
          ...txs.flatMap(tx => tx.inputs.map(i => i.addr)),
          ...txs.flatMap(tx => tx.outputs.map(o => o.addr))
        ];
        fetchAttributions(addresses);
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
              <span><strong>Balance:</strong> {satsToBTC(addrData?.balance || 0)} BTC</span>
              <span><strong>First block:</strong> {addrData?.first_block?.toLocaleString()}</span>
              <span><strong>Last block:</strong> {addrData?.last_block?.toLocaleString()}</span>
            </div>

            <div className='col'>
              <span><strong>Script Type:</strong> {addrData?.script_type}</span>
            </div>
          </SummaryWrapper>
        </BsBlock>

        <BsBlock>
          <h3>Transactions ({totalTxs.toLocaleString()})</h3>
          <hr />
          {txs.map(tx => <BtcTransactionTable key={tx._id} transaction={tx} />)}
        </BsBlock>
      </BsWrapper>
    </>
  );
};

export default Address;