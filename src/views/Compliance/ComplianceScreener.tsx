import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import { AuditOutlined, DatabaseOutlined, TableOutlined, FileSearchOutlined, HistoryOutlined } from '@ant-design/icons';
import { colors } from '../../styles/variables';
import UnassignedTransactionsTab from './components/unassigned-transactions/UnassignedTransactionsTab';
import MonitoredAddressesTab from './components/monitored-addresses/MonitoredAddressesTab';
import ActiveCasesTab from './components/active-cases/ActiveCasesTab';
import ArchivedCasesTab from './components/archived-cases/ArchivedCasesTab';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMonitoredAddresses, selectAllAddresses } from '../../store/slices/monitoredAddressesSlice';

const { TabPane } = Tabs;

type TabKey = 'transactions' | 'active-cases' | 'addresses' | 'archived-cases';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

// Simplified inline card component to replace ViewWrapper
interface ComplianceCardProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
}

const ComplianceCard: React.FC<ComplianceCardProps> = ({ title, icon, description }) => {
  const { theme } = useTheme();
  
  return (
    <div className="bg-card border-b border-border shadow-sm m-6">
      <div className="px-6 py-6 lg:px-8">
        <header className="mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex items-center justify-center w-8 h-8 text-muted-foreground">
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-['Inter']">
              {title}
            </h1>
          </div>
        </header>
        {description && (
          <p style={{ 
            marginTop: -15, 
            color: theme === 'light' ? colors.black : colors.white 
          }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

const styles = {
  icon: {
    marginRight: '8px',
  },
  titleIcon: {
    fontSize: '28px',
    color: colors.attributionHover,
    fontWeight: 'bold',
  },
};

const ComplianceScreener: React.FC = () => {
  const { theme } = useTheme();
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
    <span>
      <span style={styles.icon}>{icon}</span>
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
    <div className="w-full h-full flex flex-col overflow-hidden">
      <ComplianceCard 
        title="Compliance Screener" 
        icon={<AuditOutlined style={styles.titleIcon} />}
        description={getTabDescription(activeTab)}
      />
      <main className="flex-1 px-6 lg:px-8 space-y-6 font-['Inter'] overflow-auto">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
        >
          {tabConfig.map(({ key, label, icon, component }) => (
            <TabPane
              key={key}
              tab={createTabHeader(icon, label)}
            >
              {component}
            </TabPane>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default ComplianceScreener;