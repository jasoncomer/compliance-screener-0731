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
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-none">
      <div className="px-4 py-2">
        <div className="flex flex-wrap gap-3 justify-start">
          {/* Block Hash Card */}
          <div className="flex flex-col bg-gradient-to-br from-slate-100 to-gray-200 dark:from-background dark:to-background shadow-md rounded-2xl p-2 flex-1 min-w-[250px] text-gray-900 dark:text-gray-100 relative border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
            <div className="absolute top-2 right-2 opacity-10 text-2xl select-none pointer-events-none">#</div>
            <div className="flex items-center gap-1 mb-1">
              <Hash className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Block Hash</span>
              <button
                onClick={onCopyClick}
                className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                title="Copy block hash"
              >
                {copySuccess ? <CheckCircle className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
              </button>
            </div>
            <div className="text-lg font-bold break-all mb-1 font-mono">{truncateHash(block.hash)}</div>
            
            {/* Block Height */}
            <div className="mb-1 p-1 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-200 dark:border-orange-800">
              <div className="text-xs font-medium text-orange-700 dark:text-orange-300">Block Height</div>
              <div className="text-xs text-orange-600 dark:text-orange-400 font-mono">
                #{block.number.toLocaleString()}
              </div>
            </div>
            
            {/* Merkle Root */}
            <div className="flex items-start gap-1 mt-auto">
              <div className="flex gap-1 flex-wrap overflow-hidden">
                <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border font-mono">
                  Merkle: {truncateStringMiddle(block.merkle_root, 12)}
                </div>
              </div>
            </div>
          </div>

          {/* Block Size & Weight Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-background dark:to-background shadow-md rounded-2xl p-5 flex-1 min-w-[250px] text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
            <div className="flex items-center gap-1 mb-1">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium">Block Size & Weight</span>
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <span className="flex items-center gap-1 font-medium text-xs"><Database className="w-3 h-3" /> Size</span>
                <span className="font-bold text-xs">{formatBytes(block.size)}</span>
              </div>
              <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <span className="flex items-center gap-1 font-medium text-xs"><Zap className="w-3 h-3" /> Weight</span>
                <span className="font-bold text-xs">{block.weight.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                <span className="flex items-center gap-1 font-medium text-xs"><Box className="w-3 h-3" /> Stripped</span>
                <span className="font-bold text-xs">{formatBytes(block.stripped_size)}</span>
              </div>
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
                <span className="text-gray-600 dark:text-gray-300 text-xs">Timestamp</span>
                <span className="font-bold text-xs">{formatTimestamp(Number(block.timestamp))}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Version</span>
                <span className="font-bold text-xs">{block.version}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Nonce</span>
                <span className="font-bold text-xs">{typeof block.nonce === 'number' ? block.nonce.toLocaleString() : block.nonce}</span>
              </div>
              <div className="flex justify-between items-center p-1 bg-gray-50 dark:bg-background rounded">
                <span className="text-gray-600 dark:text-gray-300 text-xs">Bits</span>
                <span className="font-bold text-xs">{block.bits}</span>
              </div>
            </div>
          </div>

          {/* Transaction Count Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-slate-50 to-gray-100 dark:from-background dark:to-background shadow-md rounded-2xl p-5 flex-1 min-w-[200px] text-gray-900 dark:text-gray-100 items-center border border-slate-200 dark:border-gray-700 min-h-[160px] max-h-[200px]">
            <div className="flex items-center gap-1 mb-1">
              <ArrowLeftRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium">Transactions</span>
            </div>
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">{block.transaction_count.toLocaleString()}</span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Total Transactions</span>
                
                {/* Coinbase transaction indicator */}
                <div className="mt-2 flex flex-col gap-1">
                  <div className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
                    +1 Coinbase TX
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockSummary;
