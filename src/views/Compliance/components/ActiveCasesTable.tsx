import React, { useState } from 'react';
import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { IComplianceTransaction } from '../../../typings/compliance';
import { TransactionDetailsModal } from '../modals/TransactionDetails/TransactionDetailsModal';
import { conversionRates, currencySymbols } from './CurrencySelector';
import { getRiskScoreColor } from '../utils/compliance.utils';
import { getBlockchainLabel } from '../../../utils/display-labels';
import { useAppContext } from '../../../context/AppContext';
import { truncateAddress } from '../../../utils/crypto';

interface ActiveCasesTableProps {
  transactions: IComplianceTransaction[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  onTableChange: (pagination: any) => void;
}

const ActiveCasesTable: React.FC<ActiveCasesTableProps> = ({
  transactions,
  totalTransactions,
  currentPage,
  pageSize,
  loading,
  onTableChange,
}) => {
  const denom = 'USD';
  const { user } = useAppContext();
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  // Function to handle row click to show transaction details
  const handleViewDetails = (record: IComplianceTransaction) => {
    setSelectedTransactionId(record._id);
    setIsDetailsModalVisible(true);
  };
  
  // Function to get user name from ID
  const getReviewerName = (reviewerId?: string) => {
    if (!reviewerId) return 'Unassigned';
    
    // For demo purposes. In a real app, you'd fetch this from your users list
    // This is just a placeholder - you should replace with actual user data
    if (reviewerId === user?._id) {
      return `${user.name} ${user.surname}`;
    }
    
    return `User ${reviewerId.substring(0, 8)}`;
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'txId',
      key: 'txId',
      width: 180,
      render: (txId: string) => {
        if (!txId) return null;
        return (
          <a href={`/home/block-explorer/transaction/${txId}`} target="_blank" rel="noopener noreferrer">
            {truncateAddress(txId)}
          </a>
        )
      }
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 100,
      render: (blockchain: string) => {
        return getBlockchainLabel(blockchain);
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => a.amount - b.amount,
      render: (amount: number) => (
        <span>
          BTC {(amount / 100000000).toFixed(8)}
        </span>
      )
    },
    {
      title: 'Converted Amount',
      key: 'convertedAmount',
      width: 120,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) =>
        (a.amount * conversionRates[denom]) - (b.amount * conversionRates[denom]),
      render: (_: any, record: IComplianceTransaction) => (
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
      title: 'Client ID',
      dataIndex: 'clientId',
      key: 'clientId',
      width: 100,
    },
    {
      title: 'Assigned To',
      dataIndex: 'reviewerId',
      key: 'reviewerId',
      width: 150,
      render: (reviewerId?: string) => getReviewerName(reviewerId),
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 100,
      render: (scores: number[]) => {
        if (!scores || scores.length === 0) return 'N/A';
        const score = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
        return (
          <Tag color={getRiskScoreColor(score)} style={{ fontWeight: 'bold' }}>
            {Math.round(score)}
          </Tag>
        );
      }
    },
    {
      title: 'Last Updated',
      dataIndex: 'reviewTimestamp',
      key: 'reviewTimestamp',
      width: 150,
      render: (reviewTimestamp?: Date) => 
        reviewTimestamp ? new Date(reviewTimestamp).toLocaleString() : 'Not reviewed yet',
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => {
        if (!a.reviewTimestamp) return -1;
        if (!b.reviewTimestamp) return 1;
        return new Date(a.reviewTimestamp).getTime() - new Date(b.reviewTimestamp).getTime();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: IComplianceTransaction) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(record);
              }}
            />
          </Tooltip>
          <Tooltip title="Approve">
            <Button 
              type="primary" 
              size="small" 
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              icon={<CheckOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                // Handle approve action
              }}
            />
          </Tooltip>
          <Tooltip title="Escalate">
            <Button 
              danger 
              size="small" 
              icon={<CloseOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                // Handle escalate action
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        className="active-cases-table"
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
        scroll={{ x: 1300 }}
      />

      <TransactionDetailsModal 
        isVisible={isDetailsModalVisible}
        onClose={() => setIsDetailsModalVisible(false)}
        transactionId={selectedTransactionId}
      />
    </>
  );
};

export default ActiveCasesTable;