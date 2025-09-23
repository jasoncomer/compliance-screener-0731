import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileSearch, History, Search, Table } from 'lucide-react';

import ViewWrapper from '../../components/ViewWrapper';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMonitoredAddresses, selectAllAddresses } from '../../store/slices/monitoredAddressesSlice';

import ActiveCasesTab from './components/active-cases/ActiveCasesTab';
import ArchivedCasesTab from './components/archived-cases/ArchivedCasesTab';
import MonitoredAddressesTab from './components/monitored-addresses/MonitoredAddressesTab';
import UnassignedTransactionsTab from './components/unassigned-transactions/UnassignedTransactionsTab';

type TabKey = 'transactions' | 'active-cases' | 'addresses' | 'archived-cases';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const ComplianceScreener: React.FC = () => {
  const dispatch = useAppDispatch();
  const monitoredAddresses = useAppSelector(selectAllAddresses);
  const [activeTab, setActiveTab] = useState<TabKey>('transactions');

  // Load monitored addresses from Redux store
  useEffect(() => {
    dispatch(fetchMonitoredAddresses());
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = (activeKey: string) => {
    setActiveTab(activeKey as TabKey);
  };

  // Handle addresses change - memoized to prevent unnecessary re-renders
  const handleAddressesChange = useCallback(() => {
    dispatch(fetchMonitoredAddresses());
  }, [dispatch]);

  const getTabDescription = (tab: TabKey): string => {
    switch (tab) {
      case 'active-cases':
        return 'This page shows transactions under investigation that require compliance review or escalation.';
      case 'archived-cases':
        return 'This page shows completed and archived compliance cases for reference and auditing.';
      case 'transactions':
        return 'This page shows new unassigned transactions that need to be assigned to a compliance officer for review.';
      default:
        return 'This page monitors client defined wallets for incoming transactions and calculates risk scoring.';
    }
  };


  // Memoize tabConfig to prevent recreation on every render
  const tabConfig: TabConfig[] = useMemo(() => [
    {
      key: 'transactions',
      label: 'Unassigned Transactions',
      icon: <Table className="w-4 h-4" />,
      component: <UnassignedTransactionsTab initialStatusFilter="UNASSIGNED" />,
    },
    {
      key: 'active-cases',
      label: 'Active Cases',
      icon: <FileSearch className="w-4 h-4" />,
      component: <ActiveCasesTab isActive={activeTab === 'active-cases'} />,
    },
    {
      key: 'addresses',
      label: 'Monitored Addresses',
      icon: <Database className="w-4 h-4" />,
      component: (
        <MonitoredAddressesTab
          addresses={monitoredAddresses}
          onAddressesChange={handleAddressesChange}
        />
      ),
    },
    {
      key: 'archived-cases',
      label: 'Archived Cases',
      icon: <History className="w-4 h-4" />,
      component: <ArchivedCasesTab isActive={activeTab === 'archived-cases'} />,
    },
  ], [monitoredAddresses, activeTab, handleAddressesChange]);

  return (
    <ViewWrapper
      icon={<Search className="w-8 h-8 text-orange-500" />}
      title="Compliance Screener"
      description={getTabDescription(activeTab)}
      fullWidth={true}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          {tabConfig.map(({ key, label, icon }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabConfig.map(({ key, component }) => (
          <TabsContent key={key} value={key} className="mt-4">
            {component}
          </TabsContent>
        ))}
      </Tabs>
    </ViewWrapper>
  );
};

export default ComplianceScreener;