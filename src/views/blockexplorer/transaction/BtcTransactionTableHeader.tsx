import React from 'react';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import styled from 'styled-components';

interface BtcTransactionTableHeaderProps {
  transaction: BtcTransaction;
}

const TxTableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  margin-top: 10px;
  margin-bottom: 10px;
  color: black;
  font-size: 14px;
  background-color: #f9f9f9;
  th {
    padding: 10px;
    border-bottom: 1px solid #ccc;
  }
`;

const BtcTransactionTableHeader: React.FC<BtcTransactionTableHeaderProps> = ({ transaction }) => {
  if (!transaction) return null;

  return (
    <TxTableHeader>
      <span>{transaction.txid}</span>
      <span>{transaction.block}</span>
      <span>{transaction.fee_amt}</span>
      <span>{new Date(transaction.timestamp).toISOString()}</span>
    </TxTableHeader>
  );
};

export default BtcTransactionTableHeader;