import React, { useState, useEffect } from 'react';
import { Table } from 'antd';
import type { ColumnType, TableRowSelection } from 'antd/es/table/interface';
import { EComplianceTransactionStatus, IComplianceTransaction } from '../../../../typings/compliance';
import { currencySymbols } from '../CurrencySelector';
import { useAttribution } from '../../../../context/AttributionContext';
import { truncateAddress } from '../../../../utils/crypto';
import { getRiskScoreColor, getComplianceReportStatusColor } from '../../utils/compliance.utils';
import { getBlockchainLabel } from '../../../../utils/display-labels';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { Badge } from '@/components/ui/badge';
import { UnassignedTransactionModal } from './UnassignedTransactionModal';
import { getTransactionGroupClassWithHover } from '../../../../utils/transactionGrouping';
import '../../../../styles/transactionGrouping.css';

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
  const [selectedTransactionData, setSelectedTransactionData] = useState<IComplianceTransaction | null>(null);
  const { getPrice, prices } = useCryptoPrices();
  const [btcPrice, setBtcPrice] = useState<number>(0);

  // Update BTC price when prices change
  useEffect(() => {
    const price = getPrice('BTC');
    if (price !== null) {
      setBtcPrice(price);
    }
  }, [prices, getPrice]);

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state changed:', { isVisible: isDetailsModalVisible, transactionId: selectedTransactionId });
  }, [isDetailsModalVisible, selectedTransactionId]);

  // Function to handle row click to show transaction details
  const handleRowClick = (record: IComplianceTransaction) => {
    console.log('Row clicked:', record);
    console.log('Setting transaction ID:', record._id);
    setSelectedTransactionId(record._id);
    setSelectedTransactionData(record);
    setIsDetailsModalVisible(true);
    console.log('Modal should now be visible');
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
      render: (status: EComplianceTransactionStatus) => (
        <Badge className={getComplianceReportStatusColor(status)}>
          {status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      title: 'Client Id',
      dataIndex: 'clientId',
      key: 'clientId',
      width: 100,
      sorter: false,
      render: (clientId: string) => (
        <span className="text-white">{clientId}</span>
      ),
    },
    {
      title: 'Counterparty Entities',
      dataIndex: 'counterpartyEntities',
      key: 'counterpartyEntities',
      width: 170,
      render: (counterpartyEntities: string[]) => {
        if (!counterpartyEntities.length) return (
          <span className="text-gray-400">N/A</span>
        );
        return (
          <span className="text-gray-400">
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
      sorter: false,
      render: (txId: string) => {
        if (!txId) return null;
        return (
          <span className="text-white">{truncateAddress(txId)}</span>
        )
      }
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 100,
      sorter: false,
      render: (blockchain: string) => (
        <span className="text-white">{getBlockchainLabel(blockchain)}</span>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      sorter: true,
      sortOrder: sortBy === 'amount' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (amount: number) => (
        <div className="flex flex-col">
          <span className="text-white">BTC {(amount / 100000000)}</span>
          <span className="text-sm text-gray-400">
            {currencySymbols[denom]}
            {((amount / 100000000) * btcPrice)
              .toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </div>
      )
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => (
        <span className="text-gray-400">{new Date(timestamp).toLocaleString()}</span>
      ),
      sorter: true,
      sortOrder: sortBy === 'timestamp' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 80,
      sorter: true,
      sortOrder: sortBy === 'riskScores' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (scores: number[]) => {
        if (!scores || scores.length === 0) return 'N/A';
        const score = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
        return (
          <Badge className={`${getRiskScoreColor(score)} text-white`}>
            {score}
          </Badge>
        );
      }
    },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <Table
        className="compliance-table w-full flex-1"
        dataSource={transactions}
        columns={columns as ColumnType<IComplianceTransaction>[]}
        rowKey="_id"
        rowSelection={rowSelection}
        size="small"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalTransactions,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        loading={loading}
        onChange={onTableChange}
        rowClassName={(record) => getTransactionGroupClassWithHover(record.txId)}
        onRow={(record) => ({
          onClick: (event) => {
            const target = event.target as HTMLElement;
            if (target.tagName.toLowerCase() !== 'input' && target.className.indexOf('ant-checkbox') === -1) {
              handleRowClick(record);
            }
          },
        })}
        scroll={{ 
          x: 1000, // Reduced width from 1200px to 1000px
          y: 'calc(100vh - 600px)' // Adjusted for the new layout structure
        }}
        style={{
          // Disable any potential animations
          transition: 'none',
          animation: 'none'
        }}
      />

      {/* <TransactionDetailsModal
        isVisible={isDetailsModalVisible}
        onClose={() => setIsDetailsModalVisible(false)}
        transactionId={selectedTransactionId}
        transactionData={selectedTransactionData}
      /> */}

      <UnassignedTransactionModal
        transaction={selectedTransactionData}
        isOpen={isDetailsModalVisible}
        onClose={() => setIsDetailsModalVisible(false)}
        onAssign={() => {}}
        teamMembers={[]}
      />

    </div>
  );
};

export default UnassignedTransactionsTable; 