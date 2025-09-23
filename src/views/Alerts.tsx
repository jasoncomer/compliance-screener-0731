import React, { useState } from 'react';

import { AlertOutlined } from '@ant-design/icons';
import { Button, Collapse,Input, Select, Space, Table, Tag, Typography } from 'antd';

import { colors } from '@/design-system/tokens'

import ViewWrapper from '../components/ViewWrapper';
import { useTheme } from '../context/ThemeContext';

import AlertConfig from './AlertConfig';

const { Paragraph } = Typography;
const { Option } = Select;

interface Alert {
  id: string;
  type: 'transaction' | 'address' | 'entity';
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

const Alerts: React.FC = () => {
  const { theme } = useTheme();
  // This would typically come from an API or state management
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'address',
      severity: 'medium',
      message: 'Set alert for address 0x1234 on Bitcoin when 100 is transferred in with severity MEDIUM, send alarm.',
      timestamp: new Date().toISOString(),
      status: 'new'
    },
    {
      id: '2',
      type: 'transaction',
      severity: 'high',
      message: 'Triggered alert sample: High severity transaction triggered.',
      timestamp: new Date().toISOString(),
      status: 'new'
    },
    {
      id: '3',
      type: 'entity',
      severity: 'low',
      message: 'Other alert sample: Low severity acknowledged alert.',
      timestamp: new Date().toISOString(),
      status: 'acknowledged'
    },
    // Add more sample alerts as needed
  ];

  // Replace existing filtering state with two sets: one for All Alerts and one for Triggered Alerts

  // State for All Alerts filtering
  const [allSearchText, setAllSearchText] = useState('');
  const [allSeverityFilter, setAllSeverityFilter] = useState('All');
  const resetAllFilters = () => {
    setAllSearchText('');
    setAllSeverityFilter('All');
  };

  // State for Triggered Alerts filtering
  const [triggeredSearchText, setTriggeredSearchText] = useState('');
  const [triggeredSeverityFilter, setTriggeredSeverityFilter] = useState('All');
  const resetTriggeredFilters = () => {
    setTriggeredSearchText('');
    setTriggeredSeverityFilter('All');
  };

  // Derive triggered alerts (assuming status 'new' indicates a triggered alert)
  const triggeredAlerts = alerts.filter(alert => alert.status === 'new');

  // Filter alerts for All Alerts section
  const filteredAllAlerts = alerts.filter(alert => {
    const matchesText = alert.message.toLowerCase().includes(allSearchText.toLowerCase());
    const matchesSeverity = allSeverityFilter === 'All' || alert.severity === allSeverityFilter;
    return matchesText && matchesSeverity;
  });

  // Filter alerts for Triggered Alerts section
  const filteredTriggeredAlerts = triggeredAlerts.filter(alert => {
    const matchesText = alert.message.toLowerCase().includes(triggeredSearchText.toLowerCase());
    const matchesSeverity = triggeredSeverityFilter === 'All' || alert.severity === triggeredSeverityFilter;
    return matchesText && matchesSeverity;
  });

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'transaction' ? 'blue' : type === 'address' ? 'green' : 'purple'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={severity === 'high' ? 'red' : severity === 'medium' ? 'orange' : 'green'}>
          {severity.toUpperCase()}
        </Tag>
      ),
      sorter: (a: Alert, b: Alert) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder];
      },
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      sorter: (a: Alert, b: Alert) => a.message.localeCompare(b.message),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'new' ? 'red' : status === 'acknowledged' ? 'orange' : 'green'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: Alert, b: Alert) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
  ];

  return (
    <ViewWrapper
      icon={<AlertOutlined style={{ fontSize: '28px', color: colors.attribution.hover, fontWeight: 'bold' }} />}
      title="Alerts"
      className={theme === 'light' ? 'light-theme-view' : ''}
    >
      <div className={theme === 'light' ? 'light-theme-view' : ''} style={{padding: '20px'}}>
        <Paragraph>
          Monitor and manage alerts for suspicious blockchain activities, high-risk transactions,
          and potential security threats.
        </Paragraph>

        {/* Alert Configuration Section */}
        <Collapse defaultActiveKey={[]} expandIconPosition="right">
          <Collapse.Panel 
            header="Alert Configuration" 
            key="1" 
            style={{ 
              border: `1px solid ${colors.attribution.hover}`, 
              backgroundColor: theme === 'dark' ? colors.gray[900] : colors.white, 
              color: theme === 'dark' ? colors.gray[50] : colors.gray[800] 
            }} 
            className="no-collapse-padding"
          >
            <AlertConfig />
          </Collapse.Panel>
        </Collapse>

        {/* All Alerts Section */}
        <h2 style={{ color: theme === 'dark' ? colors.white : colors.gray[800] }}>All Alerts</h2>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search alerts"
            onSearch={(value) => setAllSearchText(value)}
            allowClear
            style={{ width: 200 }}
            value={allSearchText}
          />
          <Select defaultValue="All" style={{ width: 120 }} onChange={(value) => setAllSeverityFilter(value)} value={allSeverityFilter}>
            <Option value="All">All</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
          <Button type="default" style={{ height: 32 }} onClick={resetAllFilters}>Reset Filters</Button>
        </Space>
        <Table
          dataSource={filteredAllAlerts}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className={`${theme === 'light' ? 'light-theme-table' : ''}`}
          style={{ backgroundColor: theme === 'light' ? '#ffffff' : '' }}
        />

        {/* Triggered Alerts Section */}
        <h2 style={{ marginTop: 0, color: theme === 'dark' ? colors.white : colors.gray[800] }}>Triggered Alerts</h2>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search triggered alerts"
            onSearch={(value) => setTriggeredSearchText(value)}
            allowClear
            style={{ width: 200 }}
            value={triggeredSearchText}
          />
          <Select defaultValue="All" style={{ width: 120 }} onChange={(value) => setTriggeredSeverityFilter(value)} value={triggeredSeverityFilter}>
            <Option value="All">All</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
          <Button type="default" style={{ height: 32 }} onClick={resetTriggeredFilters}>Reset Filters</Button>
        </Space>
        <Table
          dataSource={filteredTriggeredAlerts}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className={`${theme === 'light' ? 'light-theme-table' : ''}`}
          style={{ backgroundColor: theme === 'light' ? '#ffffff' : '' }}
        />
      </div>
    </ViewWrapper>
  );
};

export default Alerts; 