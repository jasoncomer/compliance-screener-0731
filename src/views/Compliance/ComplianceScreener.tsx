import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import ViewWrapper from '../../components/ViewWrapper';
import { AuditOutlined, DatabaseOutlined, TableOutlined, FileSearchOutlined } from '@ant-design/icons';
import { colors } from '../../styles/variables';
import UnassignedTransactionsTab from './components/UnassignedTransactionsTabTab';
import AddressesTab from './components/AddressesTab';
import ActiveCasesTab from './components/ActiveCasesTab';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMonitoredAddresses, selectAllAddresses } from '../../store/slices/monitoredAddressesSlice';

const { TabPane } = Tabs;

const ComplianceScreener: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const monitoredAddresses = useAppSelector(selectAllAddresses);
  const [activeTab, setActiveTab] = useState<string>('transactions');

  // Load monitored addresses from Redux store
  useEffect(() => {
    dispatch(fetchMonitoredAddresses());
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = (activeKey: string) => {
    setActiveTab(activeKey);
  };

  const txTabHeader = (
    <span>
      <TableOutlined style={{ marginRight: '8px' }} />
      Unassigned Transactions
    </span>
  );

  const addressesTabHeader = (
    <span>
      <DatabaseOutlined style={{ marginRight: '8px' }} />
      Monitored Addresses
    </span>
  );

  const activeCasesTabHeader = (
    <span>
      <FileSearchOutlined style={{ marginRight: '8px' }} />
      Active Cases
    </span>
  );

  return (
    <ViewWrapper title="Compliance Screener" icon={<AuditOutlined style={{ fontSize: '28px', color: colors.attributionHover, fontWeight: 'bold' }} />}>
      <p style={{ marginTop: -15, color: theme === 'light' ? colors.black : colors.white }}>
        {activeTab === 'active-cases' 
          ? 'This page shows transactions under investigation that require compliance review or escalation.'
          : activeTab === 'transactions'
            ? 'This page shows new unassigned transactions that need to be assigned to a compliance officer for review.'
            : 'This page monitors client defined wallets for incoming transactions and calculates risk scoring.'}
      </p>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
      >
        <TabPane
          tab={txTabHeader}
          key="transactions"
        >
          <UnassignedTransactionsTab isActive={activeTab === 'transactions'} />
        </TabPane>
        <TabPane
          tab={activeCasesTabHeader}
          key="active-cases"
        >
          <ActiveCasesTab isActive={activeTab === 'active-cases'} />
        </TabPane>
        <TabPane
          tab={addressesTabHeader}
          key="addresses"
        >
          <AddressesTab
            addresses={monitoredAddresses}
            onAddressesChange={() => dispatch(fetchMonitoredAddresses())}
          />
        </TabPane>
      </Tabs>
    </ViewWrapper>
  );
};

export default ComplianceScreener;