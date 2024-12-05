import React, { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/api';
import { BsBlock } from '../../styles/Table';
import { IBtcAddress } from '../../typings/BtcAddress';
import { BsWrapper } from '../../styles/ocmmon';
import styled from 'styled-components';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { satsToBTC } from '../../utils/crypto';
import { IAttribution, IAttributionMap, IReferenceAttribution, ReferenceAttributionMap } from '../../typings/ReferenceAttribution';
import useAttribution from '../../hooks/useAttribution';

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
  const [attributions, setAttributions] = React.useState<IAttributionMap>({});
  const [referenceAttributions, setReferenceAttributions] = React.useState<ReferenceAttributionMap>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAttributions = useCallback(async (addresses: string[]) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, referenceData } = await api.blockchain.getAttributions(addresses);

      const newAttributions = data.reduce((acc: IAttributionMap, curr: IAttribution) => {
        acc[curr.addr] = curr;
        return acc;
      }, {});

      const newReferenceAttributions = referenceData.reduce((acc: ReferenceAttributionMap, curr: IReferenceAttribution) => {
        acc[curr.addr] = curr;
        return acc;
      }, {});

      setAttributions(newAttributions);
      setReferenceAttributions(newReferenceAttributions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attributions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (!address) return;
        const { data, txData } = await api.blockchain.getAddress(address);
        console.log(data);
        setAddrData(data);
        setTxs(txData);
        const addresses = [
          address,
          ...txData.flatMap(tx => tx.inputs.map(i => i.addr)),
          ...txData.flatMap(tx => tx.outputs.map(o => o.addr))
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
              <span><strong>Total Received:</strong> {addrData?.script_type}</span>
              <span><strong>Multisig:</strong> {addrData?.multisig}</span>
            </div>
          </SummaryWrapper>
        </BsBlock>

        <BsBlock>
          <h3>Transactions ({txs.length.toLocaleString()})</h3>
          <hr />
          {txs.map(tx => <BtcTransactionTable transaction={tx} attributions={attributions} referenceAttributions={referenceAttributions} />)}
        </BsBlock>
      </BsWrapper>
    </>
  );
};

export default Address;