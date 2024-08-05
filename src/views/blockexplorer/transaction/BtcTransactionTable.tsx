import React from 'react';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { BsBlock } from '../../../styles/Table';
import BtcTransactionInputsOutputs from './BtcTransactionTableInputsOutputs';

interface BtcTransactionTableProps {
  transaction: BtcTransaction;
}

const BtcTransactionTable: React.FC<BtcTransactionTableProps> = ({ transaction }) => {
  if (!transaction) return null;

  return (
    <BsBlock>
      <div>
        <h3>Transaction</h3>
      </div>

      <BtcTransactionInputsOutputs transaction={transaction} />
    </BsBlock>
  );
};

export default BtcTransactionTable;