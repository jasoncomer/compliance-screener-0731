import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { BsBlock } from '../../styles/Table';
import BtcTransactionSummary from './transaction/BtcTransactionSummary';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BsWrapper } from '../../styles/ocmmon';
import { api } from '../../api/api';
import { useTheme } from '../../context/ThemeContext';
import { useAttribution } from '../../context/AttributionContext';

const TransactionView: React.FC = () => {
  const { txid } = useParams();
  const { theme } = useTheme();
  const [transaction, setTransaction] = React.useState<BtcTransaction>();
  const { fetchAttributions } = useAttribution();

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!txid || typeof txid != 'string') return;
      const response = await api.blockchain.getTransaction(txid);
      setTransaction(response);
    }

    fetchTransaction();
  }, [txid]);

  // Fetch attributions for all addresses in the transaction
  useEffect(() => {
    if (!transaction) return;
    
    // Extract all unique addresses from inputs and outputs
    const uniqueAddresses = new Set([
      ...transaction.inputs.map(input => input.addr),
      ...transaction.outputs.map(output => output.addr)
    ]);
    
    // Fetch attributions for all addresses
    fetchAttributions(Array.from(uniqueAddresses));
  }, [transaction, fetchAttributions]);

  if (!transaction) return <div>Loading...</div>;

  return (
    <BsWrapper style={{ fontFamily: 'monospace' }}>

      <BsBlock theme={{ theme }}>
        <h3>Transaction Hash</h3>
        <hr />
        <div>
          {transaction.txid}
        </div>
        
      </BsBlock>

      <BtcTransactionSummary transaction={transaction} theme={{ theme }} />
      
      <BtcTransactionTable transaction={transaction} theme={{ theme }} />
    </BsWrapper>
  );
};

export default TransactionView;