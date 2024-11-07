import React from 'react';
import { BsBlock } from '../../../styles/Table';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import styled from 'styled-components';
import { satsToBTC } from '../../../utils/crypto';

interface BtcTransactionSummaryProps {
  transaction: BtcTransaction
}

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

const BtcTransactionSummary: React.FC<BtcTransactionSummaryProps> = ({ transaction }) => {
  return (
    <BsBlock>
      <h3>Summary</h3>
      <hr />
      <SummaryWrapper>
        <div className='col'>
          <span>
            <strong>Height:</strong> {transaction.block.toLocaleString()}
          </span>
          <span>
            <strong>Timestamp:</strong> {new Date(transaction.timestamp).toISOString()}
          </span>
          <span>
            <strong>Coinbase:</strong> {transaction.coinbase ? 'Yes' : 'No'}
          </span>
          <span>
            <strong>Coinjoin:</strong> {transaction.coinjoin ? 'Yes' : 'No'}
          </span>
        </div>

        <div className='col'>
          <span>
            <strong>Input Amount:</strong> {satsToBTC(transaction.inamt)} BTC
          </span>
          <span>
            <strong>Output Amount:</strong> {satsToBTC(transaction.outamt)} BTC
          </span>
          <span>
            <strong>Fee:</strong> {transaction.txfee}
          </span>
        </div>
      </SummaryWrapper>
    </BsBlock>
  );
};

export default BtcTransactionSummary;