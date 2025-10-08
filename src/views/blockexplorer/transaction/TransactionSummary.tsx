import React, { useMemo } from 'react';

import { 
  ArrowLeftRight,
  Box,
  CheckCircle,
  Clock, 
  Copy,
  Hash, 
  TrendingDown, 
  TrendingUp} from 'lucide-react';

import { cn } from '../../../lib/utils';
import { BtcTransaction } from '../../../typings/BtcTransaction';
import { satsToBTC } from '../../../utils/crypto';

interface TransactionSummaryProps {
  transaction: BtcTransaction;
  copySuccess: boolean;
  onCopyClick: (e: React.MouseEvent) => void;
}

const TransactionSummary: React.FC<TransactionSummaryProps> = React.memo(({
  transaction,
  copySuccess,
  onCopyClick
}) => {
  const inputAmount = transaction.input_amt || 0;
  const outputAmount = transaction.output_amt || 0;
  const fee = inputAmount - outputAmount;

  const truncatedHash = useMemo(() => {
    if (!transaction.txid) return '';
    return `${transaction.txid.slice(0, 8)}...${transaction.txid.slice(-8)}`;
  }, [transaction.txid]);

  const formattedTimestamp = useMemo(() => {
    return new Date(transaction.timestamp * 1000).toLocaleString();
  }, [transaction.timestamp]);

  const getTransactionTypeIcon = () => {
    if (transaction.coinbase) {
      return <Box className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    }
    if (transaction.is_coinjoin) {
      return <ArrowLeftRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
    return <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
  };

  const getTransactionTypeLabel = () => {
    if (transaction.coinbase) return 'Coinbase';
    if (transaction.is_coinjoin) return 'Coinjoin';
    return 'Regular';
  };

  const getTransactionTypeColor = () => {
    if (transaction.coinbase) return 'text-yellow-600 dark:text-yellow-400';
    if (transaction.is_coinjoin) return 'text-purple-600 dark:text-purple-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-none">
      <div className="px-4 py-2">
        <div className="flex flex-wrap gap-3 justify-start">
          {/* Transaction Hash Card */}
          <div className="flex flex-col bg-gradient-to-br from-slate-100 to-gray-200 dark:from-background dark:to-background shadow-md rounded-2xl p-2 flex-1 min-w-[250px] text-gray-900 dark:text-gray-100 relative border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
            <div className="absolute top-2 right-2 opacity-10 text-2xl select-none pointer-events-none">#</div>
            <div className="flex items-center gap-1 mb-1">
              <Hash className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Transaction Hash</span>
              <button
                onClick={onCopyClick}
                className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                title="Copy transaction hash"
              >
                {copySuccess ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
              </button>
            </div>
            <div className="text-lg font-bold break-all mb-1 font-mono">{truncatedHash}</div>
            
            {/* Transaction Type */}
            <div className="mb-1 p-1 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
              <div className="text-xs font-medium text-orange-700 dark:text-orange-300">Transaction Type</div>
              <div className="flex items-center gap-1">
                {getTransactionTypeIcon()}
                <span className={cn("text-xs font-medium", getTransactionTypeColor())}>
                  {getTransactionTypeLabel()}
                </span>
              </div>
            </div>
            
            {/* Block Height */}
            <div className="flex items-start gap-1 mt-auto">
              <div className="flex gap-1 flex-wrap overflow-hidden">
                <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border">
                  Block #{transaction.block.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Amount Flow Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-background dark:to-background shadow-md rounded-2xl p-5 flex-1 min-w-[250px] text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium">Transaction Amounts</span>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
                <span className="flex items-center gap-1 font-medium text-xs"><TrendingDown className="w-3 h-3" /> Input</span>
                <span className="font-bold text-xs">{satsToBTC(inputAmount).toFixed(8)} BTC</span>
              </div>
              <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span className="flex items-center gap-1 font-medium text-xs"><TrendingUp className="w-3 h-3" /> Output</span>
                <span className="font-bold text-xs">{satsToBTC(outputAmount).toFixed(8)} BTC</span>
              </div>
              {fee > 0 && (
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  <span className="flex items-center gap-1 font-medium text-xs">Fee</span>
                  <span className="font-bold text-xs">{satsToBTC(fee).toFixed(8)} BTC</span>
                </div>
              )}
            </div>
          </div>

          {/* Block Information Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-background dark:to-background shadow-md rounded-2xl p-6 flex-1 min-w-[250px] text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium">Block Information</span>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Block Height</span>
                <span className="font-bold text-xs">{transaction.block.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Timestamp</span>
                <span className="font-bold text-xs">{formattedTimestamp}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Inputs</span>
                <span className="font-bold text-xs">{transaction.inputs?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Outputs</span>
                <span className="font-bold text-xs">{transaction.outputs?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Transaction Status Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-background dark:to-background shadow-md rounded-2xl p-5 flex-1 min-w-[200px] text-gray-900 dark:text-gray-100 items-center border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium">Transaction Status</span>
            </div>
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-lg font-extrabold text-green-600 dark:text-green-400">Confirmed</span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Transaction is confirmed</span>
                
                {/* Special transaction indicators */}
                <div className="mt-2 flex flex-col gap-1">
                  {transaction.coinbase && (
                    <div className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
                      Coinbase Transaction
                    </div>
                  )}
                  {transaction.is_coinjoin && (
                    <div className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded border border-purple-200 dark:border-purple-800">
                      Coinjoin Transaction
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TransactionSummary.displayName = 'TransactionSummary';

export default TransactionSummary;
