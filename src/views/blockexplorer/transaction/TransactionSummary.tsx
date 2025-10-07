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
    <>
      {/* Main Cards - Modern Minimalistic Design */}
      <div className="flex flex-wrap gap-4 justify-start">
        {/* Transaction Hash Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[280px] text-gray-900 dark:text-gray-100 relative border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="absolute top-4 right-4">
            <Hash className="w-5 h-5 text-gray-300 dark:text-gray-700" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
              <Hash className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Transaction Hash</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{truncatedHash}</span>
                <button
                  onClick={onCopyClick}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Copy transaction hash"
                >
                  {copySuccess ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Transaction Type */}
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Transaction Type</div>
            <div className="flex items-center gap-2">
              {getTransactionTypeIcon()}
              <span className={cn("text-sm font-medium", getTransactionTypeColor())}>
                {getTransactionTypeLabel()}
              </span>
            </div>
          </div>

          {/* Block Height */}
          <div className="flex items-start gap-2 mt-auto">
            <div className="flex gap-2 flex-wrap">
              <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border">
                Block #{transaction.block.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Amount Flow Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[280px] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction Amounts</div>
                <div className="text-2xl font-bold">{satsToBTC(inputAmount).toFixed(8)} <span className="text-sm font-normal text-gray-500">BTC</span></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-auto">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Input</span>
              </div>
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">{satsToBTC(inputAmount).toFixed(8)} BTC</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Output</span>
              </div>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{satsToBTC(outputAmount).toFixed(8)} BTC</span>
            </div>
            {fee > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fee</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{satsToBTC(fee).toFixed(8)} BTC</span>
              </div>
            )}
          </div>
        </div>

        {/* Block Information Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[280px] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Block Information</div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Block Height</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{transaction.block.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Timestamp</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formattedTimestamp}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Inputs</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{transaction.inputs?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Outputs</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{transaction.outputs?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Transaction Status Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[240px] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction Status</div>
          </div>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">Confirmed</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Transaction is confirmed</span>
              
              {/* Special transaction indicators */}
              <div className="mt-3 flex flex-col gap-1">
                {transaction.coinbase && (
                  <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
                    Coinbase Transaction
                  </div>
                )}
                {transaction.is_coinjoin && (
                  <div className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded border border-purple-200 dark:border-purple-800">
                    Coinjoin Transaction
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

TransactionSummary.displayName = 'TransactionSummary';

export default TransactionSummary;
