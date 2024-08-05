import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BtcTransaction } from '../../typings/BtcTransaction';
import { api } from '../../api/api';
import { BsBlock } from '../../styles/Table';
import BtcTransactionSummary from './transaction/BtcTransactionSummary';
import BtcTransactionTable from './transaction/BtcTransactionTable';
import { BsWrapper } from '../../styles/ocmmon';


interface TransactionProps { }

const Transaction: React.FC<TransactionProps> = () => {
  const { txid } = useParams();
  const [transaction, setTransaction] = React.useState<BtcTransaction>();

  console.log('[Transaction] txid:', txid);

  useEffect(() => {
    const fetchTransaction = async () => {
      console.log('before txid:', txid, typeof txid);
      if (!txid || typeof txid != 'string') return;
      console.log('fetching txid:', txid);
      const response = await api.blockchain.getTransaction(txid);
      console.log('data:', response);
      setTransaction(response);
    }

    fetchTransaction();
  }, [txid]);

  if (!transaction) return <div>Loading...</div>;

  return (
    <BsWrapper>
      <h1>Transaction</h1>

      <BsBlock>
        <h3>Transaction Hash</h3>
        <hr />
        <div>
          {transaction.txid}
        </div>
      </BsBlock>

      <BtcTransactionSummary transaction={transaction} />
      
      <BtcTransactionTable transaction={transaction} />
    </BsWrapper>
  );
};

export default Transaction;