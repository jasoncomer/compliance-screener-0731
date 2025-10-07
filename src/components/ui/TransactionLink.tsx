import React from 'react';

import { Link } from 'react-router-dom';

import { useTransactionPrefetch } from '../../hooks/useTransactionPrefetch';
import { cn } from '../../lib/utils';

interface TransactionLinkProps {
  txid: string;
  className?: string;
  children?: React.ReactNode;
  truncate?: boolean;
}

export const TransactionLink: React.FC<TransactionLinkProps> = ({
  txid,
  className,
  children,
  truncate = true
}) => {
  const { prefetchTransaction } = useTransactionPrefetch();

  const handleMouseEnter = () => {
    // Pre-fetch transaction data on hover
    prefetchTransaction(txid);
  };

  const displayText = truncate && !children
    ? `${txid.slice(0, 8)}...${txid.slice(-8)}`
    : children || txid;

  return (
    <Link
      to={`/home/block-explorer/transaction/${txid}`}
      className={cn(
        "text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors font-mono text-sm",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter} // Also prefetch on keyboard navigation
    >
      {displayText}
    </Link>
  );
};