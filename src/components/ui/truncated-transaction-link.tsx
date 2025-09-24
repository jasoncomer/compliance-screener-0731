import React from 'react';

import { ExternalLink } from 'lucide-react';

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
  const truncatedTxId = txId.length > truncateLength * 2 + 3
    ? `${txId.slice(0, truncateLength)}...${txId.slice(-truncateLength)}`
    : txId;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://app-staging.blockscout.ai/home/block-explorer/transaction/${txId}`, '_blank');
  };

  return (
    <a
      href={`https://app-staging.blockscout.ai/home/block-explorer/transaction/${txId}`}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 font-mono text-sm",
        "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
        "underline decoration-dotted underline-offset-2 transition-colors cursor-pointer",
        className
      )}
      title={txId}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{truncatedTxId}</span>
      {showIcon && (
        <ExternalLink className="h-3 w-3 inline-block flex-shrink-0" />
      )}
    </a>
  );
};

export default TruncatedTransactionLink;