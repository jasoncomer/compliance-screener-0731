import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Check, Copy } from 'lucide-react';

import { TransactionLink } from '../../../components/ui/TransactionLink';
import useWindowSize from '../../../hooks/useWindowSize';
import { cn } from '../../../lib/utils';
import { BsBlock } from '../../../styles/Table';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { satsToBTC } from '../../../utils/crypto';

import BtcTransactionInputsOutputs from './BtcTransactionTableInputsOutputs';


interface BtcTransactionHeaderProps {
  txHash: string;
  blockHeight: number;
  date: string;
  fee: number;
  isSmallScreen: boolean;
}

const BtcTransactionHeader: React.FC<BtcTransactionHeaderProps> = React.memo(({
  txHash,
  blockHeight,
  date,
  fee,
  isSmallScreen
}) => {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [showCopyAlert, setShowCopyAlert] = useState<boolean>(false);

  // Clean up timers on unmount
  useEffect(() => {
    let successTimer: NodeJS.Timeout;
    let alertTimer: NodeJS.Timeout;

    if (copySuccess) {
      successTimer = setTimeout(() => setCopySuccess(false), 1000);
    }
    if (showCopyAlert) {
      alertTimer = setTimeout(() => setShowCopyAlert(false), 1000);
    }

    return () => {
      clearTimeout(successTimer);
      clearTimeout(alertTimer);
    };
  }, [copySuccess, showCopyAlert]);

  const copyToClipboard = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    navigator.clipboard.writeText(txHash)
      .then(() => {
        setCopySuccess(true);
        setShowCopyAlert(true);
      })
      .catch(err => {
        console.error('Failed to copy transaction hash: ', err);
      });
  }, [txHash]);

  return (
    <div className={cn(
      "flex justify-between items-center p-2.5 rounded mb-2.5",
      "bg-gray-50 dark:bg-gray-800"
    )}>
      <div className="flex flex-col font-mono text-foreground text-sm">
        <span className="font-bold mb-1">Transaction Hash:</span>
        <div className="flex items-center">
          <button
            onClick={copyToClipboard}
            title="Copy transaction hash"
            className={cn(
              "cursor-pointer text-gray-500 text-lg flex items-center flex-shrink-0 mr-2",
              "hover:text-foreground transition-colors"
            )}
          >
            {copySuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <TransactionLink
            txid={txHash}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            truncate={isSmallScreen}
          />
        </div>
      </div>
      <div className="flex flex-col font-mono text-foreground text-sm">
        <span className="font-bold mb-1">Block Height:</span>
        <Link
          to={`/home/block-explorer/block/${blockHeight}`}
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          {blockHeight.toLocaleString()}
        </Link>
      </div>
      <div className="flex flex-col font-mono text-foreground text-sm">
        <span className="font-bold mb-1">Fee:</span>
        <span className="text-foreground">{satsToBTC(fee).toFixed(8)} BTC</span>
      </div>
      <div className="flex flex-col font-mono text-foreground text-sm">
        <span className="font-bold mb-1">Date:</span>
        <span className="text-foreground">{date}</span>
      </div>
      {showCopyAlert && (
        <div className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2",
          "bg-orange-500 text-white px-8 py-4 rounded-md shadow-lg z-[1000]",
          "text-lg animate-fadeIn"
        )}>
          Transaction hash copied
        </div>
      )}
    </div>
  );
});

BtcTransactionHeader.displayName = 'BtcTransactionHeader';

interface BtcTransactionTableProps {
  transaction: BtcTransaction;
}

const BtcTransactionTable: React.FC<BtcTransactionTableProps> = ({ transaction }) => {
  const { width } = useWindowSize();

  const isSmallScreen = width < 1080;

  // Memoize date formatting
  const formattedDate = useMemo(
    () => transaction ? new Date(transaction.timestamp * 1000).toLocaleString() : '',
    [transaction]
  );

  if (!transaction) return null;

  return (
    <BsBlock className="relative">
      <BtcTransactionHeader
        txHash={transaction.txid}
        blockHeight={transaction.block}
        fee={transaction.fee_amt}
        date={formattedDate}
        isSmallScreen={isSmallScreen}
      />

      <BtcTransactionInputsOutputs transaction={transaction} />
    </BsBlock>
  );
};

export default BtcTransactionTable;