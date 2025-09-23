import React from 'react';

import { Plus, Upload } from 'lucide-react';

import { cn } from '../../../lib/utils';

interface MonitoredTableActionsProps {
  onAddAddress: () => void;
  onUploadAddresses: () => void;
  children?: React.ReactNode;
  className?: string;
}

const MonitoredTableActions: React.FC<MonitoredTableActionsProps> = ({
  onAddAddress,
  onUploadAddresses,
  children,
  className,
}) => {
  return (
    <div className={cn("flex justify-between mb-6 gap-px", className)}>
      <div className="flex gap-2">
        <button
          onClick={onAddAddress}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
        <button
          onClick={onUploadAddresses}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Bulk Upload
        </button>
      </div>
      {children}
    </div>
  );
};

export default MonitoredTableActions; 