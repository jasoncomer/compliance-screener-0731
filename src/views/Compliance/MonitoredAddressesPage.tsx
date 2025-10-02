import React, { useCallback, useEffect } from 'react';

import { Database } from 'lucide-react';

import ViewWrapper from '../../components/ViewWrapper';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMonitoredAddresses, selectAllAddresses } from '../../store/slices/monitoredAddressesSlice';
import MonitoredAddressesTab from './components/monitored-addresses/MonitoredAddressesTab';

const MonitoredAddressesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const monitoredAddresses = useAppSelector(selectAllAddresses);

  // Load monitored addresses from Redux store
  useEffect(() => {
    dispatch(fetchMonitoredAddresses());
  }, [dispatch]);

  // Handle addresses change - memoized to prevent unnecessary re-renders
  const handleAddressesChange = useCallback(() => {
    dispatch(fetchMonitoredAddresses());
  }, [dispatch]);

  return (
    <ViewWrapper
      icon={<Database className="w-8 h-8 text-orange-500" />}
      title="Monitored Addresses"
      description="This page monitors client defined wallets for incoming transactions and calculates risk scoring."
      fullWidth={true}
    >
      <MonitoredAddressesTab
        addresses={monitoredAddresses}
        onAddressesChange={handleAddressesChange}
      />
    </ViewWrapper>
  );
};

export default MonitoredAddressesPage;