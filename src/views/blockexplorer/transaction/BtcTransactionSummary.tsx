import React from 'react';
import { BsBlock } from '../../../styles/Table';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { satsToBTC } from '../../../utils/crypto';
import { cn } from '../../../lib/utils';

interface BtcTransactionSummaryProps {
  transaction: BtcTransaction;
}

interface SummaryWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const SummaryWrapper: React.FC<SummaryWrapperProps> = ({ children, className }) => (
  <div className={cn("flex justify-between flex-row", className)}>
    {children}
  </div>
);

const BtcTransactionSummary: React.FC<BtcTransactionSummaryProps> = ({ transaction }) => {
  // Use the correct field names from the API response
  const inputAmount = transaction.input_amt || 0;
  const outputAmount = transaction.output_amt || 0;
 

  return (
    <BsBlock>
      <h3>Summary</h3>
      <hr />
      <SummaryWrapper>
        <div className="flex flex-1 flex-col p-2.5">
          <span className="mt-2.5 flex justify-between">
            <strong>Height:</strong> {transaction.block.toLocaleString()}
          </span>
          <span className="mt-2.5 flex justify-between">
            <strong>Timestamp:</strong> {new Date(transaction.timestamp*1000).toLocaleString()}
          </span>
          <span className="mt-2.5 flex justify-between">
            <strong>Coinbase:</strong> {transaction.coinbase ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-2.5">
          <span className="mt-2.5 flex justify-between">
            <strong>Input Amount:</strong> {satsToBTC(inputAmount).toFixed(8)} BTC
          </span>
          <span className="mt-2.5 flex justify-between">
            <strong>Output Amount:</strong> {satsToBTC(outputAmount).toFixed(8)} BTC
          </span>
          <span className="mt-2.5 flex justify-between">
            <strong>Coinjoin:</strong> {transaction.is_coinjoin ? 'Yes' : 'No'}
          </span>
        </div>
      </SummaryWrapper>
    </BsBlock>
  );
};

export default BtcTransactionSummary;