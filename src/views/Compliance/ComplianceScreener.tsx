import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import ViewWrapper from '../../components/ViewWrapper';
import { AuditOutlined, DatabaseOutlined, TableOutlined, FileSearchOutlined, HistoryOutlined } from '@ant-design/icons';
import { colors } from '../../styles/variables';
import UnassignedTransactionsTab from './components/UnassignedTransactionsTab';
import AddressesTab from './components/AddressesTab';
import ActiveCasesTab from './components/ActiveCasesTab';
import ArchivedCasesTab from './components/ArchivedCasesTab';
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

const styles = {
  icon: {
    marginRight: '8px',
  },
  titleIcon: {
    fontSize: '28px',
    color: colors.attributionHover,
    fontWeight: 'bold',
  },
  description: {
    marginTop: -15,
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
      {React.cloneElement(icon as React.ReactElement, { style: styles.icon })}
      {label}
    </span>
  );

  const tabConfig: TabConfig[] = [
    {
      key: 'transactions',
      label: 'Unassigned Transactions',
      icon: <TableOutlined />,
      component: <UnassignedTransactionsTab isActive={activeTab === 'transactions'} />,
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
        <AddressesTab
          addresses={monitoredAddresses}
          onAddressesChange={() => dispatch(fetchMonitoredAddresses())}
        />
      ),
    },
    {
      key: 'archived-cases',
      label: 'Archived Cases',
      icon: <HistoryOutlined />,
      component: <ArchivedCasesTab isActive={activeTab === 'archived-cases'} />,
    },
  ];

  return (
    <ViewWrapper 
      title="Compliance Screener" 
      icon={<AuditOutlined style={styles.titleIcon} />}
      fullWidth={true}
    >
      <p style={{ ...styles.description, color: theme === 'light' ? colors.black : colors.white }}>
        {getTabDescription(activeTab)}
      </p>
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
    </ViewWrapper>
  );
};

export default ComplianceScreener;