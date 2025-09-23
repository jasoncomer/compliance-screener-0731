import React from 'react';

import { DatabaseOutlined } from '@ant-design/icons';

import { cn } from '../../../../lib/utils';
import { MonitoredAddress } from '../../../../typings/compliance';

import MonitoredAddressManagement from './MonitoredAddressManagement';

interface MonitoredAddressesTabProps {
  addresses: MonitoredAddress[];
  onAddressesChange: (addresses: MonitoredAddress[]) => void;
  organizationId?: string;
  isLoading?: boolean;
  className?: string;
}

const MonitoredAddressesTab: React.FC<MonitoredAddressesTabProps> = ({
  addresses,
  onAddressesChange,
  organizationId,
  className,
  // isLoading = false,
}) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-black dark:text-white">
          <DatabaseOutlined className="mr-2" />
          Monitored Addresses Management
        </h3>
      </div>
      <MonitoredAddressManagement
        addresses={addresses}
        onAddressesChange={onAddressesChange}
        organizationId={organizationId}
      />
    </div>
  );
};

export default MonitoredAddressesTab;