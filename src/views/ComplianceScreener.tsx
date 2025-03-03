import React, { useState, useEffect } from 'react';
import { Table, Button, Select, message, Modal, Popover, Space, Tooltip, Tag } from 'antd';
import { useTheme } from '../context/ThemeContext';
import ViewWrapper from '../components/ViewWrapper';
import { AuditOutlined, SettingOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { colors } from '../styles/variables';
import styled from 'styled-components';
import AddressManagement from '../components/AddressManagement';
import { api } from '../api/api';
import type { MonitoredAddress } from '../types/addresses';

const { Option } = Select;

const HeaderActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const StyledSpace = styled(Space)`
  display: flex;
  align-items: center;
`;

// Define the type for a transaction record
interface TransactionRecord {
  id: string;
  counterpartyAddress: string;
  counterpartyEntity: string;
  blockchain: string;
  amount: number;
  timestamp: string;
  riskScore: number;
  status: string; // one of the status options
  reviewer?: string;
  reviewTimestamp?: string;
}

// Dummy sample data
const initialData: TransactionRecord[] = [
  {
    id: '1',
    counterpartyAddress: '0xABC123',
    counterpartyEntity: 'Entity A',
    blockchain: 'Bitcoin',
    amount: 500,
    timestamp: new Date().toISOString(),
    riskScore: 75,
    status: 'Needs Reviewed'
  },
  {
    id: '2',
    counterpartyAddress: '0xDEF456',
    counterpartyEntity: 'Entity B',
    blockchain: 'Ethereum',
    amount: 1200,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    riskScore: 45,
    status: 'Approved',
    reviewer: 'Alice Smith',
    reviewTimestamp: '2023-09-01T12:34:56.000Z'
  },
  {
    id: '3',
    counterpartyAddress: '0xGHI789',
    counterpartyEntity: 'Entity C',
    blockchain: 'Bitcoin',
    amount: 300,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    riskScore: 85,
    status: 'Special Handling'
  },
  {
    id: '4',
    counterpartyAddress: '0xJKL012',
    counterpartyEntity: 'Entity D',
    blockchain: 'Ethereum',
    amount: 950,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    riskScore: 60,
    status: 'Closed',
    reviewer: 'Michael Brown',
    reviewTimestamp: '2023-08-31T09:45:00.000Z'
  },
  {
    id: '5',
    counterpartyAddress: '0xMNO345',
    counterpartyEntity: 'Entity E',
    blockchain: 'Bitcoin',
    amount: 800,
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    riskScore: 50,
    status: 'Needs Reviewed'
  },
  {
    id: '6',
    counterpartyAddress: '0xPQR678',
    counterpartyEntity: 'Entity F',
    blockchain: 'Ethereum',
    amount: 2000,
    timestamp: new Date(Date.now() - 8400000).toISOString(),
    riskScore: 90,
    status: 'Special Handling'
  },
  {
    id: '7',
    counterpartyAddress: '0xSTU901',
    counterpartyEntity: 'Entity G',
    blockchain: 'Bitcoin',
    amount: 450,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    riskScore: 65,
    status: 'Approved',
    reviewer: 'Samantha Davis',
    reviewTimestamp: '2023-09-02T15:12:00.000Z'
  },
  {
    id: '8',
    counterpartyAddress: '0xAAA111',
    counterpartyEntity: 'Entity H',
    blockchain: 'Bitcoin',
    amount: 610,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    riskScore: 70,
    status: 'Approved'
  },
  {
    id: '9',
    counterpartyAddress: '0xBBB222',
    counterpartyEntity: 'Entity I',
    blockchain: 'Ethereum',
    amount: 750,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    riskScore: 55,
    status: 'Needs Reviewed'
  },
  {
    id: '10',
    counterpartyAddress: '0xCCC333',
    counterpartyEntity: 'Entity J',
    blockchain: 'Bitcoin',
    amount: 650,
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    riskScore: 80,
    status: 'Special Handling'
  },
  {
    id: '11',
    counterpartyAddress: '0xDDD444',
    counterpartyEntity: 'Entity K',
    blockchain: 'Ethereum',
    amount: 940,
    timestamp: new Date(Date.now() - 3300000).toISOString(),
    riskScore: 66,
    status: 'Closed',
    reviewer: 'Jane Doe',
    reviewTimestamp: new Date().toISOString()
  },
  {
    id: '12',
    counterpartyAddress: '0xEEE555',
    counterpartyEntity: 'Entity L',
    blockchain: 'Bitcoin',
    amount: 800,
    timestamp: new Date(Date.now() - 2000000).toISOString(),
    riskScore: 88,
    status: 'Approved'
  }
];

const statusOptions = ['Needs Reviewed', 'Approved', 'Special Handling', 'Closed'];

const ComplianceScreener: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState<TransactionRecord[]>(initialData);
  const [denom, setDenom] = useState<string>('USD');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<TransactionRecord | null>(null);
  const [addressManagementVisible, setAddressManagementVisible] = useState(false);
  const [monitoredAddresses, setMonitoredAddresses] = useState<MonitoredAddress[]>([]);

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

  const conversionRates: { [key: string]: number } = { USD: 1, GBP: 0.75, MXN: 20 };
  const currencySymbols: { [key: string]: string } = { USD: '$', GBP: '£', MXN: 'MXN ' };

  // Update the status in the state when dropdown changes
  const handleStatusChange = (id: string, newStatus: string) => {
    const newData = data.map(record => {
      if (record.id === id) {
        return { ...record, status: newStatus };
      }
      return record;
    });
    setData(newData);
  };

  // Inline update: record reviewer name and timestamp when update button is clicked
  const handleUpdate = (id: string) => {
    const reviewer = 'John Doe'; // static reviewer for demonstration
    const reviewTimestamp = new Date().toISOString();
    const newData = data.map(record => {
      if (record.id === id) {
        message.success(`Record ${id} updated by ${reviewer} at ${new Date(reviewTimestamp).toLocaleString()}`);
        return { ...record, reviewer, reviewTimestamp };
      }
      return record;
    });
    setData(newData);
  };

  // Function to open modal when an entity is clicked
  const handleOpenEntity = (record: TransactionRecord) => {
    setSelectedEntity(record);
    setModalVisible(true);
  };

  // Define table columns
  const columns = [
    {
      title: 'Counterparty Address',
      dataIndex: 'counterpartyAddress',
      key: 'counterpartyAddress',
      sorter: (a: TransactionRecord, b: TransactionRecord) => a.counterpartyAddress.localeCompare(b.counterpartyAddress),
      // Simple text filter
      onFilter: (value: any, record: TransactionRecord) => record.counterpartyAddress.includes(String(value)),
      render: (text: string, record: TransactionRecord) => (
        <Popover
          content={(
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ cursor: 'pointer', color: colors.attributionHover }} onClick={() => navigate('/home/explorer')}>Explorer</div>
              <div style={{ cursor: 'pointer', color: colors.attributionHover }} onClick={() => navigate('/home/block-explorer')}>Block Explorer</div>
              <div style={{ cursor: 'pointer', color: colors.attributionHover }} onClick={() => navigate('/home/risk-scoring')}>Risk Scoring</div>
            </div>
          )}
          title={`View ${text} in:`}
          trigger="hover"
        >
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>{text}</span>
        </Popover>
      )
    },
    {
      title: 'Counterparty Entity',
      dataIndex: 'counterpartyEntity',
      key: 'counterpartyEntity',
      sorter: (a: TransactionRecord, b: TransactionRecord) => a.counterpartyEntity.localeCompare(b.counterpartyEntity),
      onFilter: (value: any, record: TransactionRecord) => record.counterpartyEntity.includes(String(value)),
      render: (text: string, record: TransactionRecord) => (
        <a onClick={() => handleOpenEntity(record)} style={{ cursor: 'pointer', color: colors.attributionHover, fontWeight: 'bold' }}>{text}</a>
      )
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 120,
      sorter: (a: TransactionRecord, b: TransactionRecord) => a.blockchain.localeCompare(b.blockchain),
      onFilter: (value: any, record: TransactionRecord) => record.blockchain.includes(String(value))
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      sorter: (a: TransactionRecord, b: TransactionRecord) => a.amount - b.amount,
      onFilter: (value: any, record: TransactionRecord) => record.amount === Number(value)
    },
    {
      title: 'Converted Amount',
      key: 'convertedAmount',
      sorter: (a: TransactionRecord, b: TransactionRecord) => (a.amount * conversionRates[denom]) - (b.amount * conversionRates[denom]),
      render: (_: any, record: TransactionRecord) => (
        <span>
          {currencySymbols[denom]}{(record.amount * conversionRates[denom]).toFixed(2)}
        </span>
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: TransactionRecord, b: TransactionRecord) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      onFilter: (value: any, record: TransactionRecord) => record.timestamp.includes(String(value))
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 80,
      sorter: (a: TransactionRecord, b: TransactionRecord) => a.riskScore - b.riskScore,
      onFilter: (value: any, record: TransactionRecord) => record.riskScore === Number(value)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: TransactionRecord, b: TransactionRecord) => a.status.localeCompare(b.status),
      filters: statusOptions.map(option => ({ text: option, value: option })),
      onFilter: (value: any, record: TransactionRecord) => record.status === String(value),
      render: (text: string, record: TransactionRecord) => (
        <Select
          defaultValue={record.status}
          dropdownClassName="status-dropdown"
          style={{ width: 150 }}
          onChange={(value) => handleStatusChange(record.id, value)}
        >
          {statusOptions.map(option => (
            <Option key={option} value={option}>{option}</Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Last Change',
      key: 'lastChange',
      render: (_: any, record: TransactionRecord) => {
        return record.reviewer && record.reviewTimestamp ? (
          <span>{record.reviewer}, {new Date(record.reviewTimestamp).toLocaleString()}</span>
        ) : (
          <span>—</span>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: TransactionRecord) => (
        <Button type="link" onClick={() => handleUpdate(record.id)} style={{ color: colors.attributionHover, fontWeight: 'bold' }}>Update</Button>
      )
    }
  ];

  return (
    <ViewWrapper title="Compliance Screener" icon={<AuditOutlined style={{ fontSize: '28px', color: colors.attributionHover, fontWeight: 'bold' }} />}>
      <div style={{ padding: '16px' }}>
        <HeaderActions>
          <StyledSpace>
            <p style={{ margin: 0, color: theme === 'light' ? colors.black : colors.white }}>
              This page monitors client defined wallets for incoming transactions and calculates risk scoring.
            </p>
            <Tooltip title="Number of addresses being monitored">
              <Tag color={colors.attributionHover}>
                <DatabaseOutlined /> {monitoredAddresses.length} Addresses
              </Tag>
            </Tooltip>
          </StyledSpace>
          <Space>
            <Button 
              icon={<SettingOutlined />}
              onClick={() => setAddressManagementVisible(true)}
            >
              Manage Monitored Addresses
            </Button>
            <Select value={denom} onChange={(value) => setDenom(value)} style={{ width: 120 }}>
              <Option value="USD">USD</Option>
              <Option value="GBP">GBP</Option>
              <Option value="MXN">MXN</Option>
            </Select>
          </Space>
        </HeaderActions>
        <Table
          className="compliance-table"
          dataSource={data}
          columns={columns}
          rowKey="id"
          sticky={{ offsetHeader: 80 }}
          style={{ background: theme === 'light' ? colors.white : colors.gray[700], color: theme === 'light' ? colors.black : colors.white }}
        />
        <Modal
          title={`Entity Explorer: ${selectedEntity ? selectedEntity.counterpartyEntity : ''}`}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          {selectedEntity ? (
            <div style={{ color: theme === 'light' ? colors.black : colors.white }}>
              <p><strong>Entity:</strong> {selectedEntity.counterpartyEntity}</p>
              <p><strong>Address:</strong> {selectedEntity.counterpartyAddress}</p>
              <p><strong>Blockchain:</strong> {selectedEntity.blockchain}</p>
              <p><strong>Risk Score:</strong> {selectedEntity.riskScore}</p>
            </div>
          ) : null}
        </Modal>
        {/* Address Management Modal */}
        <Modal
          title="Address Management"
          open={addressManagementVisible}
          onCancel={() => setAddressManagementVisible(false)}
          width={1200}
          footer={null}
        >
          <AddressManagement 
            onClose={() => {
              setAddressManagementVisible(false);
              // Refresh monitored addresses after changes
              api.compliance.getAddresses().then(setMonitoredAddresses);
            }}
          />
        </Modal>
      </div>
    </ViewWrapper>
  );
};

export default ComplianceScreener; 