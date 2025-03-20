import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import ViewWrapper from '../../components/ViewWrapper';
import { AuditOutlined, DatabaseOutlined, TableOutlined } from '@ant-design/icons';
import { colors } from '../../styles/variables';
import { api } from '../../api/api';
import type { MonitoredAddress } from '../../typings/compliance';
import TransactionsTab from './components/TransactionsTab';
import AddressesTab from './components/AddressesTab';

const { TabPane } = Tabs;

const ComplianceScreener: React.FC = () => {
  const { theme } = useTheme();
  const [monitoredAddresses, setMonitoredAddresses] = useState<MonitoredAddress[]>([]);
  const [activeTab, setActiveTab] = useState<string>('transactions');

  // Load monitored addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await api.compliance.getAddresses();
        setMonitoredAddresses(addresses);
      } catch (error) {
        console.error('Failed to load monitored addresses:', error);
      }
    };
    loadAddresses();
  }, []);

  // Handle tab change
  const handleTabChange = (activeKey: string) => {
    setActiveTab(activeKey);
  };

  // Handle address updates from the AddressesTab
  const handleAddressesChange = (updatedAddresses: MonitoredAddress[]) => {
    setMonitoredAddresses(updatedAddresses);
  };

  return (
    <ViewWrapper title="Compliance Screener" icon={<AuditOutlined style={{ fontSize: '28px', color: colors.attributionHover, fontWeight: 'bold' }} />}>
      <p style={{ marginTop: -15, color: theme === 'light' ? colors.black : colors.white }}>
        This page monitors client defined wallets for incoming transactions and calculates risk scoring.
      </p>
      <div>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          type="card"
        >
          <TabPane 
            tab={
              <span>
                <TableOutlined style={{ marginRight: '8px' }} />
                Incoming Risk
              </span>
            } 
            key="transactions"
          >
            <TransactionsTab
              monitoredAddresses={monitoredAddresses}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                <DatabaseOutlined style={{ marginRight: '8px' }} />
                Monitored Addresses
              </span>
            } 
            key="addresses"
          >
            <AddressesTab
              addresses={monitoredAddresses}
              onAddressesChange={handleAddressesChange}
            />
          </TabPane>
        </Tabs>
      </div>
    </ViewWrapper>
  );
};

export default ComplianceScreener;