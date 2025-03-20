import React, { useState } from 'react';
import { Table, Button, Space, Select, Popover, Tooltip, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { colors } from '../../../styles/variables';
import { FolderAddOutlined, EyeOutlined } from '@ant-design/icons';
import { ComplianceTransaction, TransactionFilters } from '../../../typings/compliance';
import { conversionRates, currencySymbols } from './CurrencySelector';
import ModalCreateCaseFromTransaction from '../../../components/modals/ModalCreateCaseFromTransaction';
import { useAttribution } from '../../../context/AttributionContext';
import { truncateAddress } from '../../../utils/crypto';

const { Option } = Select;

interface TransactionsTableProps {
  transactions: ComplianceTransaction[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  denom: string;
  onTableChange: (pagination: any) => void;
  onStatusChange: (id: string, newStatus: string) => void;
  onEntityClick: (record: ComplianceTransaction) => void;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  totalTransactions,
  currentPage,
  pageSize,
  loading,
  denom,
  onTableChange,
  onStatusChange,
  onEntityClick,
}) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { attributions } = useAttribution();
  const [selectedTransaction, setSelectedTransaction] = useState<ComplianceTransaction | null>(null);
  const [isCaseModalVisible, setIsCaseModalVisible] = useState(false);

  console.log({ transactions, totalTransactions, currentPage, pageSize, loading, denom, onTableChange, onStatusChange, onEntityClick });

  // Function to handle the create case action
  const handleCreateCase = (record: ComplianceTransaction, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click event
    setSelectedTransaction(record);
    setIsCaseModalVisible(true);
  };

  // Function to get risk score color
  const getRiskScoreColor = (score: number) => {
    if (score > 70) return colors.danger;
    if (score > 40) return colors.warning;
    return colors.success;
  };

  const getCryptocurrencyPrice = (cryptocurrency: string) => {
    const price = conversionRates[cryptocurrency];
    return price ? price.toFixed(2) : 'N/A';
  };

  console.log({ denom, currencySymbols, conversionRates, transactions });

  const columns = [
    {
      title: 'Counterparty Entity',
      dataIndex: 'monitoredAddressId',
      key: 'counterpartyEntity',
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) =>
        a.monitoredAddressId.address.localeCompare(b.monitoredAddressId.address),
      onFilter: (value: any, record: ComplianceTransaction) =>
        record.monitoredAddressId.address.includes(String(value)),
      render: (monitoredAddress: ComplianceTransaction['monitoredAddressId'], record: ComplianceTransaction) => (
        <a onClick={() => onEntityClick(record)} style={{ cursor: 'pointer', color: colors.attributionHover, fontWeight: 'bold' }}>
          {attributions[monitoredAddress.address]?.entity}
        </a>
      )
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) =>
        a.transactionId.localeCompare(b.transactionId),
      onFilter: (value: any, record: ComplianceTransaction) =>
        record.transactionId.includes(String(value)),
      render: (transactionId: string) => (
        <a href={`/home/block-explorer/transaction/${transactionId}`} target="_blank" rel="noopener noreferrer">
          {truncateAddress(transactionId)}
        </a>
      )
    },
    {
      title: 'Account Owner',
      dataIndex: 'monitoredAddressId',
      key: 'monitoredAddressId',
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) =>
        a.monitoredAddressId.address.localeCompare(b.monitoredAddressId.address),
      render: (monitoredAddress: ComplianceTransaction['monitoredAddressId']) =>
        <span>{monitoredAddress.notes || monitoredAddress.address}</span>
    },
    {
      title: 'Counterparty Address',
      dataIndex: 'counterpartyAddress',
      key: 'counterpartyAddress',
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) =>
        a.counterpartyAddress.localeCompare(b.counterpartyAddress),
      render: (text: string) => (
        <Popover
          content={(
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ cursor: 'pointer', color: colors.attributionHover }} onClick={() => navigate(`/home/explorer?address=${text}`)}>Explorer</div>
              <div style={{ cursor: 'pointer', color: colors.attributionHover }} onClick={() => navigate(`/home/block-explorer/address/${text}`)}>Block Explorer</div>
              <div style={{ cursor: 'pointer', color: colors.attributionHover }} onClick={() => navigate(`/home/risk-scoring?address=${text}`)}>Risk Scoring</div>
            </div>
          )}
          title={`View ${text} in:`}
        >
          <span style={{ cursor: 'pointer', color: colors.attributionHover }}>{truncateAddress(text)}</span>
        </Popover>
      )
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 120,
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) => a.blockchain.localeCompare(b.blockchain),
      onFilter: (value: any, record: ComplianceTransaction) => record.blockchain.includes(String(value))
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) =>
        a.amount - b.amount,
      onFilter: (value: any, record: ComplianceTransaction) =>
        record.amount === Number(value),
      render: (amount: number) => (
        <span>
          BTC {(amount / 100000000)}
        </span>
      )
    },
    {
      title: 'Converted Amount',
      key: 'convertedAmount',
      width: 110,
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) =>
        (a.amount * conversionRates[denom]) - (b.amount * conversionRates[denom]),
      render: (_: any, record: ComplianceTransaction) => (
        <span>
          {currencySymbols[denom]}
          {
            ((record.amount / 100000000) * 83000)
              .toLocaleString(
                'en-US',
                { minimumFractionDigits: 0, maximumFractionDigits: 2 }
              )
          }
        </span>
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      onFilter: (value: any, record: ComplianceTransaction) => record.timestamp.includes(String(value))
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 80,
      sorter: (a: ComplianceTransaction, b: ComplianceTransaction) => a.riskScore - b.riskScore,
      onFilter: (value: any, record: ComplianceTransaction) => record.riskScore === Number(value),
      render: (score: number) => (
        <Tag color={getRiskScoreColor(score)} style={{ fontWeight: 'bold' }}>
          {score}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: ComplianceTransaction) => (
        <Space size="small">
          <Button
            icon={<FolderAddOutlined />}
            type="primary"
            size="small"
            onClick={(e) => handleCreateCase(record, e)}
            title="Create Case"
          >
            Case
          </Button>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/home/block-explorer/transaction/${record.transactionId}`);
            }}
            title="View Transaction"
          />
        </Space>
      )
    }
  ];

  return (
    <>
      <Table
        className="compliance-table"
        dataSource={transactions}
        columns={columns}
        rowKey="_id"
        sticky={{ offsetHeader: 80 }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalTransactions,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        loading={loading}
        onChange={onTableChange}
        onRow={(record) => ({
          onClick: () => onEntityClick(record),
        })}
      />

      <ModalCreateCaseFromTransaction
        isVisible={isCaseModalVisible}
        onClose={() => setIsCaseModalVisible(false)}
        transaction={selectedTransaction}
      />
    </>
  );
};

export default TransactionsTable; 