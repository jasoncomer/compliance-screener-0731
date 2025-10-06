import React from 'react';

import { 
  ArrowLeftRight,
  Box, 
  CheckCircle,
  Clock, 
  Copy,
  Database,
  Hash, 
  Zap
} from 'lucide-react';

import { IBtcBlock } from '../../typings/Block';
import { truncateStringMiddle } from '../../utils/generic';

interface BlockSummaryProps {
  block: IBtcBlock;
  copySuccess: boolean;
  onCopyClick: (e: React.MouseEvent) => void;
}

const BlockSummary: React.FC<BlockSummaryProps> = ({
  block,
  copySuccess,
  onCopyClick
}) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  return (
    <>
      {/* Main Cards - Modern Minimalistic Design */}
      <div className="flex flex-wrap gap-4 justify-start">
        {/* Block Hash Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[280px] text-gray-900 dark:text-gray-100 relative border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="absolute top-4 right-4">
            <Hash className="w-5 h-5 text-gray-300 dark:text-gray-700" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
              <Hash className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Block Hash</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{truncateHash(block.hash)}</span>
                <button
                  onClick={onCopyClick}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Copy block hash"
                >
                  {copySuccess ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Block Height */}
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Block Height</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
              #{block.number.toLocaleString()}
            </div>
          </div>

        </div>

        {/* Block Size & Weight Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[280px] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <Database className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Block Size & Weight</div>
                <div className="text-2xl font-bold">{formatBytes(block.size)} <span className="text-sm font-normal text-gray-500">Size</span></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-auto">
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Size</span>
              </div>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{formatBytes(block.size)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Weight</span>
              </div>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{block.weight.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Stripped</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatBytes(block.stripped_size)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Merkle Root</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 font-mono">{truncateStringMiddle(block.merkle_root, 12)}</span>
            </div>
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
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Timestamp</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatTimestamp(Number(block.timestamp))}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{block.version}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Nonce</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{typeof block.nonce === 'number' ? block.nonce.toLocaleString() : block.nonce}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bits</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{block.bits}</span>
            </div>
          </div>
        </div>

        {/* Transaction Count Card */}
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex-1 min-w-[240px] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 min-h-[160px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <ArrowLeftRight className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transactions</div>
          </div>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">{block.transaction_count.toLocaleString()}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Transactions</span>
              
              {/* Coinbase transaction indicator */}
              <div className="mt-3 flex flex-col gap-1">
                <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
                  +1 Coinbase TX
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlockSummary;
