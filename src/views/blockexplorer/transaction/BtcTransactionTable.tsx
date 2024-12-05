import React from 'react';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { BsBlock } from '../../../styles/Table';
import BtcTransactionInputsOutputs from './BtcTransactionTableInputsOutputs';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { IAttributionMap, ReferenceAttributionMap } from '../../../typings/ReferenceAttribution';

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 10px;
`;

const HeaderItem = styled.div`
  display: flex;
  flex-direction: column;

  span:first-child {
    font-weight: bold;
    margin-bottom: 4px;
  }
`;

interface BtcTransactionHeaderProps {
  txHash: string;
  blockHeight: number;
  date: string;
}

const BtcTransactionHeader: React.FC<BtcTransactionHeaderProps> = ({ txHash, blockHeight, date }) => (
  <HeaderWrapper>
    <HeaderItem>
      <span>Transaction Hash:</span>
      <Link to={`/home/block-explorer/transaction/${txHash}`}>{txHash}</Link>
    </HeaderItem>
    <HeaderItem>
      <span>Block Height:</span>
      <span>{blockHeight.toLocaleString()}</span>
    </HeaderItem>
    <HeaderItem>
      <span>Date:</span>
      <span>{date}</span>
    </HeaderItem>
  </HeaderWrapper>
);


interface BtcTransactionTableProps {
  transaction: BtcTransaction;
}

const BtcTransactionTable: React.FC<BtcTransactionTableProps> = ({ transaction }) => {
  if (!transaction) return null;

  return (
    <BsBlock>
      <BtcTransactionHeader
        txHash={transaction.txid}
        blockHeight={transaction.block}
        date={new Date(transaction.timestamp * 1000).toLocaleString()}
      />

      <BtcTransactionInputsOutputs transaction={transaction} />
    </BsBlock>
  );
};

export default BtcTransactionTable;