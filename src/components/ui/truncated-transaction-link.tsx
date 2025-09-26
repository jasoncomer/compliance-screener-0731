import React, { useState } from 'react';

import { Check,Copy, ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TruncatedTransactionLinkProps {
  txId: string;
  className?: string;
  showIcon?: boolean;
  truncateLength?: number;
}

export const TruncatedTransactionLink: React.FC<TruncatedTransactionLinkProps> = ({
  txId,
  className,
  showIcon = true,
  truncateLength = 10
}) => {
  const [copied, setCopied] = useState(false);

  const truncatedTxId = txId.length > truncateLength * 2 + 3
    ? `${txId.slice(0, truncateLength)}...${txId.slice(-truncateLength)}`
    : txId;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://app-staging.blockscout.ai/home/block-explorer/transaction/${txId}`, '_blank');
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <span
        className={cn(
          "font-mono text-sm",
          "text-blue-600 dark:text-blue-400",
          className
        )}
        title={txId}
      >
        {truncatedTxId}
      </span>
      {showIcon && (
        <button
          onClick={handleClick}
          className="p-0.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          title="Open in explorer"
          type="button"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={handleCopy}
        className={cn(
          "p-0.5 transition-colors",
          copied
            ? "text-green-500 dark:text-green-400"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        )}
        title={copied ? "Copied!" : "Copy transaction ID"}
        type="button"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
};

export default TruncatedTransactionLink;