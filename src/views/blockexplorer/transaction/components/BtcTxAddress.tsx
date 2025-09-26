import React, { memo } from 'react';

import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { truncateAddress } from '@/utils/crypto';

interface BtcTxAddressProps {
  address: string;
}

const BtcTxAddress: React.FC<BtcTxAddressProps> = memo(({ address }) => {
  const url = window.location.href;
  const currAddress = url.split('/').pop();
  const displayAddress = address.length >= 42 ? truncateAddress(address) : address;
  const isCurrentAddress = address === currAddress;

  return (
    <div className="flex items-center w-full min-w-0">
      {isCurrentAddress ? (
        <span
          className="font-mono text-sm text-foreground font-semibold overflow-hidden text-ellipsis whitespace-nowrap"
          title={address}
        >
          {displayAddress}
        </span>
      ) : (
        <Link
          className={cn(
            "font-mono text-sm text-orange-500 no-underline text-left overflow-hidden text-ellipsis whitespace-nowrap",
            "hover:text-blue-500 hover:underline transition-colors duration-200",
            "dark:text-orange-400 dark:hover:text-blue-400"
          )}
          to={`/home/block-explorer/address/${address}`}
          title={address}
        >
          {displayAddress}
        </Link>
      )}
    </div>
  );
});

BtcTxAddress.displayName = 'BtcTxAddress';

export default BtcTxAddress;