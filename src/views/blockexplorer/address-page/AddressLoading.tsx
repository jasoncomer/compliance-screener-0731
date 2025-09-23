import React from 'react';

import { Loader2, Wallet } from 'lucide-react';

interface AddressLoadingProps {
  address: string;
}

const AddressLoading: React.FC<AddressLoadingProps> = ({ address }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600 dark:text-orange-400" />
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        Loading Address Data
      </h3>

      <p className="text-muted-foreground mb-6 max-w-md">
        Fetching data for address <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{address}</span>
      </p>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wallet className="w-4 h-4" />
        <span>Loading balance, transactions, and risk analysis...</span>
      </div>
    </div>
  );
};

export default AddressLoading;
