import React, { useState, useEffect } from 'react';
import { Table, Tag } from 'antd';
import type { ColumnType, TableRowSelection } from 'antd/es/table/interface';
import { colors } from '../../../../styles/variables';
import { ETransactionStatus, IComplianceTransaction } from '../../../../typings/compliance';
import { currencySymbols } from '../CurrencySelector';
import { TransactionDetailsModal } from '../../modals/TransactionDetails/TransactionDetailsModal';
import { useAttribution } from '../../../../context/AttributionContext';
import { truncateAddress } from '../../../../utils/crypto';
import { getRiskScoreColor } from '../../utils/compliance.utils';
import { getBlockchainLabel } from '../../../../utils/display-labels';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';


interface TransactionsTableProps {
  transactions: IComplianceTransaction[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  onTableChange: (pagination: any, filters: any, sorter: any) => void;
  onEntityClick?: (record: IComplianceTransaction) => void;
  // New props for selection
  selectedRowKeys: React.Key[];
  onSelectChange: (selectedRowKeys: React.Key[]) => void;
  // Sorting props
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const UnassignedTransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  totalTransactions,
  currentPage,
  pageSize,
  loading,
  onTableChange,
  selectedRowKeys,
  onSelectChange,
  sortBy = 'timestamp',
  sortOrder = 'desc',
}) => {
  const denom = 'USD';
  const { attributions } = useAttribution();
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const { getPrice, prices } = useCryptoPrices();
  const [btcPrice, setBtcPrice] = useState<number>(0);

  // Update BTC price when prices change
  useEffect(() => {
    const price = getPrice('BTC');
    if (price !== null) {
      setBtcPrice(price);
    }
  }, [prices, getPrice]);

  // Function to handle row click to show transaction details
  const handleRowClick = (record: IComplianceTransaction) => {
    setSelectedTransactionId(record._id);
    setIsDetailsModalVisible(true);
  };

  // Configure row selection
  const rowSelection: TableRowSelection<IComplianceTransaction> = {
    selectedRowKeys,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  };

  const columns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      // Remove filter dropdown since we're using the form above
      render: (status: ETransactionStatus) => (
        <Tag color={
          status === ETransactionStatus.APPROVED 
            ? 'green' 
            : status === ETransactionStatus.HOLD 
              ? 'orange' 
              : status === ETransactionStatus.CLOSED_WITH_NOTE || status === ETransactionStatus.CLOSED_WITH_SAR 
                ? 'red' 
                : 'blue'
        }>
          {status.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: 'Client Id',
      dataIndex: 'clientId',
      key: 'clientId',
      width: 100,
      sorter: false, // Disable sorting for Client ID
    },
    {
      title: 'Counterparty Entities',
      dataIndex: 'counterpartyEntities',
      key: 'counterpartyEntities',
      width: 170,
      render: (counterpartyEntities: string[]) => {
        if (!counterpartyEntities.length) return (
          <span style={{ color: colors.primaryDark }}>N/A</span>
        );
        return (
          <span style={{ color: colors.attributionHover, fontWeight: 'bold' }}>
            {counterpartyEntities.map((entity) => attributions[entity]?.entity || entity).join(', ')}
          </span>
        )
      }
    },
    {
      title: 'Transaction ID',
      dataIndex: 'txId',
      key: 'txId',
      width: 200,
      sorter: false, // Disable sorting for Transaction ID
      render: (txId: string) => {
        if (!txId) return null;
        return (
          <span>{truncateAddress(txId)}</span>
        )
      }
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 100,
      sorter: false, // Disable sorting for Blockchain
      render: (blockchain: string) => {
        return getBlockchainLabel(blockchain);
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      sorter: true, // Enable server-side sorting
      sortOrder: sortBy === 'amount' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (amount: number) => (
        <span>
          BTC {(amount / 100000000)}
        </span>
      )
    },
    {
      title: 'Converted Amount',
      key: 'convertedAmount',
      width: 140,
      sorter: false, // Disable sorting for calculated field
      render: (_: any, record: IComplianceTransaction) => (
        <span>
          {currencySymbols[denom]}
          {
            ((record.amount / 100000000) * btcPrice)
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
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
      sorter: true, // Enable server-side sorting
      sortOrder: sortBy === 'timestamp' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 80,
      sorter: true, // Enable server-side sorting
      sortOrder: sortBy === 'riskScores' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (scores: number[]) => {
        if (!scores || scores.length === 0) return 'N/A';
        const score = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
        return (
          <Tag color={getRiskScoreColor(score)} style={{ fontWeight: 'bold' }}>
            {score}
          </Tag>
        );
      }
    },
  ];

  return (
    <>
      <Table
        className="compliance-table"
        dataSource={transactions}
        columns={columns as ColumnType<IComplianceTransaction>[]}
        rowKey="_id"
        rowSelection={rowSelection}
        sticky={{
          offsetHeader: 0,
          offsetScroll: 0,
          getContainer: () => document.body
        }}
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
          onClick: (event) => {
            // Don't trigger details modal if click was on a checkbox
            const target = event.target as HTMLElement;
            if (target.tagName.toLowerCase() !== 'input' && target.className.indexOf('ant-checkbox') === -1) {
              handleRowClick(record);
            }
          },
        })}
        style={{ width: '100%' }}
        scroll={{ x: 'max-content' }}
      />

      <TransactionDetailsModal 
        isVisible={isDetailsModalVisible}
        onClose={() => setIsDetailsModalVisible(false)}
        transactionId={selectedTransactionId}
      />
    </>
  );
};

export default UnassignedTransactionsTable; 