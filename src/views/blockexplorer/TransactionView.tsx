import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { BsBlock } from '../../styles/Table';
import BtcTransactionSummary from './transaction/BtcTransactionSummary';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BsWrapper } from '../../styles/ocmmon';
import { api } from '../../api/api';
import { useTheme } from '../../context/ThemeContext';

const TransactionView: React.FC = () => {
  const { txid } = useParams();
  const { theme } = useTheme();
  const [transaction, setTransaction] = React.useState<BtcTransaction>();

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!txid || typeof txid != 'string') return;
      const response = await api.blockchain.getTransaction(txid);
      setTransaction(response);
    }

    fetchTransaction();
  }, [txid]);

  if (!transaction) return <div>Loading...</div>;

  console.log('[Transaction] txid:', txid);
  if (!transaction) return <div>Loading...</div>;

  return (
    <BsWrapper style={{ fontFamily: 'monospace' }}>
      <h1>Transaction</h1>

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