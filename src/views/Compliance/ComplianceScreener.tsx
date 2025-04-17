import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import ViewWrapper from '../../components/ViewWrapper';
import { AuditOutlined, DatabaseOutlined, TableOutlined } from '@ant-design/icons';
import { colors } from '../../styles/variables';
import TransactionsTab from './components/TransactionsTab';
import AddressesTab from './components/AddressesTab';
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
      Incoming Risk
    </span>
  );

  const addressesTabHeader = (
    <span>
      <DatabaseOutlined style={{ marginRight: '8px' }} />
      Monitored Addresses
    </span>
  );

  return (
    <ViewWrapper title="Compliance Screener" icon={<AuditOutlined style={{ fontSize: '28px', color: colors.attributionHover, fontWeight: 'bold' }} />}>
      <p style={{ marginTop: -15, color: theme === 'light' ? colors.black : colors.white }}>
        This page monitors client defined wallets for incoming transactions and calculates risk scoring.
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
          <TransactionsTab />
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