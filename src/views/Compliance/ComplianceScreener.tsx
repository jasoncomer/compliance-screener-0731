import React, { useCallback, useEffect, useMemo,useState } from 'react';

import { DatabaseOutlined, FileSearchOutlined, HistoryOutlined,TableOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import { Search } from 'lucide-react';

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

  const createTabHeader = (icon: React.ReactNode, label: string) => (
    <span className="flex items-center gap-2">
      {icon}
      {label}
    </span>
  );

  // Memoize tabConfig to prevent recreation on every render
  const tabConfig: TabConfig[] = useMemo(() => [
    {
      key: 'transactions',
      label: 'Unassigned Transactions',
      icon: <TableOutlined />,
      component: <UnassignedTransactionsTab initialStatusFilter="UNASSIGNED" />,
    },
    {
      key: 'active-cases',
      label: 'Active Cases',
      icon: <FileSearchOutlined />,
      component: <ActiveCasesTab isActive={activeTab === 'active-cases'} />,
    },
    {
      key: 'addresses',
      label: 'Monitored Addresses',
      icon: <DatabaseOutlined />,
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
      icon: <HistoryOutlined />,
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
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        items={tabConfig.map(({ key, label, icon, component }) => ({
          key,
          label: createTabHeader(icon, label),
          children: component
        }))}
      />
    </ViewWrapper>
  );
};

export default ComplianceScreener;