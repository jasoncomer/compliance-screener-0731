import React, { useState, useMemo, useCallback } from 'react';
import { Table, Tag, Button, Space, Tooltip } from 'antd';
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { EComplianceTransactionStatus, IComplianceTransaction } from '../../../../typings/compliance';
import { TransactionDetailsModal } from '../../modals/TransactionDetails/TransactionDetailsModal';
import { conversionRates, currencySymbols } from '../CurrencySelector';
import { getRiskScoreColor, getComplianceReportStatusColor } from '../../utils/compliance.utils';
import { getBlockchainLabel } from '../../../../utils/display-labels';
import { truncateAddress } from '../../../../utils/crypto';
import { useAppSelector } from '../../../../store/hooks';
import { IUser } from '../../../../typings/interfaces';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { getTransactionGroupClassWithHover } from '../../../../utils/transactionGrouping';
import '../../../../styles/transactionGrouping.css';

interface ActiveCasesTableProps {
  transactions: IComplianceTransaction[];
  totalTransactions: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  onTableChange: (pagination: any) => void;
  isArchivedTab?: boolean;
}

const ActiveCasesTable: React.FC<ActiveCasesTableProps> = React.memo(({
  transactions,
  totalTransactions,
  currentPage,
  pageSize,
  loading,
  onTableChange,
  isArchivedTab = false,
}) => {
  const denom = 'USD';
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const { users } = useAppSelector(state => state.organizations);
  const { getPrice } = useCryptoPrices();
  const btcPrice = getPrice('BTC') || 0;

  // Function to handle row click to show transaction details
  const handleViewDetails = useCallback((record: IComplianceTransaction) => {
    if (!record || !record._id) {
      console.warn('Invalid transaction record:', record);
      return;
    }
    setSelectedTransactionId(record._id);
    setIsDetailsModalVisible(true);
  }, []);

  // Function to get user name from ID
  const getReviewerName = useCallback((users: { [id: string]: IUser }, reviewerId?: string) => {
    if (!reviewerId) return 'Unassigned';

    // For demo purposes. In a real app, you'd fetch this from your users list
    // This is just a placeholder - you should replace with actual user data
    const user = users[reviewerId];
    if (user) {
      return `${user.name} ${user.surname}`;
    }

    return `User ${reviewerId.substring(0, 8)}`;
  }, []);

  // Safe render functions with error handling
  const renderStatus = (status: EComplianceTransactionStatus) => {
    try {
      return (
        <div style={{ display: 'flex', justifyContent: 'right' }}>
          <Tag color={getComplianceReportStatusColor(status)} style={{ fontWeight: 'bold' }}>
            {status || 'Unknown'}
          </Tag>
        </div>
      );
    } catch (error) {
      console.error('Error rendering status:', error);
      return <div>Error</div>;
    }
  };

  const renderTransactionId = (txId: string) => {
    try {
      if (!txId) return null;
      return (
        <div style={{ display: 'flex', justifyContent: 'right' }}>
          <a href={`/home/block-explorer/transaction/${txId}`} target="_blank" rel="noopener noreferrer">
            {truncateAddress(txId)}
          </a>
        </div>
      );
    } catch (error) {
      console.error('Error rendering transaction ID:', error);
      return <div>Error</div>;
    }
  };

  const renderBlockchain = (blockchain: string) => {
    try {
      if (!blockchain) return 'Unknown';
      return getBlockchainLabel(blockchain);
    } catch (error) {
      console.error('Error rendering blockchain:', error);
      return 'Error';
    }
  };

  const renderAmount = (amount: number) => {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
      return (
        <div style={{ display: 'flex', justifyContent: 'right' }}>
          {(amount / 100000000).toFixed(8)} BTC
        </div>
      );
    } catch (error) {
      console.error('Error rendering amount:', error);
      return <div>Error</div>;
    }
  };

  const renderConvertedAmount = (_: any, record: IComplianceTransaction) => {
    try {
      if (!record || typeof record.amount !== 'number' || isNaN(record.amount)) return 'N/A';
      const convertedAmount = ((record.amount / 100000000) * btcPrice);
      return (
        <div style={{ display: 'flex', justifyContent: 'right' }}>
          <span>
            {currencySymbols[denom]}
            {convertedAmount.toLocaleString(
              'en-US',
              { minimumFractionDigits: 0, maximumFractionDigits: 2 }
            )}
          </span>
        </div>
      );
    } catch (error) {
      console.error('Error rendering converted amount:', error);
      return <div>Error</div>;
    }
  };

  const renderReviewer = (reviewerId?: string) => {
    try {
      return <span className="capitalize">{getReviewerName(users, reviewerId)}</span>;
    } catch (error) {
      console.error('Error rendering reviewer:', error);
      return <span>Error</span>;
    }
  };

  const renderRiskScore = (scores: number[]) => {
    try {
      if (!scores || !Array.isArray(scores) || scores.length === 0) return 'N/A';
      const score = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
      if (isNaN(score)) return 'N/A';
      return (
        <Tag color={getRiskScoreColor(score)} style={{ fontWeight: 'bold' }}>
          {Math.round(score)}
        </Tag>
      );
    } catch (error) {
      console.error('Error rendering risk score:', error);
      return <div>Error</div>;
    }
  };

  const renderLastUpdated = (reviewTimestamp?: Date) => {
    try {
      if (!reviewTimestamp) return 'Not reviewed yet';
      return new Date(reviewTimestamp).toLocaleString();
    } catch (error) {
      console.error('Error rendering last updated:', error);
      return 'Error';
    }
  };

  // Ensure transactions is an array and filter out invalid entries
  const validTransactions = useMemo(() => {
    return Array.isArray(transactions) 
      ? transactions.filter(tx => tx && tx._id) 
      : [];
  }, [transactions]);

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatus,
    },
    {
      title: 'Transaction ID',
      dataIndex: 'txId',
      key: 'txId',
      width: 180,
      render: renderTransactionId,
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 100,
      render: renderBlockchain,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => {
        const aAmount = typeof a.amount === 'number' ? a.amount : 0;
        const bAmount = typeof b.amount === 'number' ? b.amount : 0;
        return aAmount - bAmount;
      },
      render: renderAmount,
    },
    {
      title: 'Converted Amount',
      key: 'convertedAmount',
      width: 110,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => {
        const aAmount = typeof a.amount === 'number' ? a.amount : 0;
        const bAmount = typeof b.amount === 'number' ? b.amount : 0;
        return (aAmount * conversionRates[denom]) - (bAmount * conversionRates[denom]);
      },
      render: renderConvertedAmount,
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      key: 'clientId',
      width: 100,
      render: (clientId: string) => clientId || 'N/A',
    },
    {
      title: 'Assigned To',
      dataIndex: 'reviewerId',
      key: 'reviewerId',
      width: 150,
      render: renderReviewer,
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 100,
      render: renderRiskScore,
    },
    {
      title: 'Last Updated',
      dataIndex: 'reviewTimestamp',
      key: 'reviewTimestamp',
      width: 150,
      render: renderLastUpdated,
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
      render: (_: any, record: IComplianceTransaction) => {
        try {
          if (!record || !record._id) return null;
          return (
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
          );
        } catch (error) {
          console.error('Error rendering actions:', error);
          return <div>Error</div>;
        }
      },
    },
  ], [renderStatus, renderTransactionId, renderBlockchain, renderAmount, renderConvertedAmount, renderReviewer, renderRiskScore, renderLastUpdated, handleViewDetails, denom, conversionRates]);

  try {
    return (
      <>
        <Table
          className="compliance-table active-cases-table"
          dataSource={validTransactions}
          columns={columns}
          rowKey="_id"
          rowClassName={(record) => getTransactionGroupClassWithHover(record.txId)}
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
          style={{ 
            width: '100%',
            // Disable any potential animations
            transition: 'none',
            animation: 'none'
          }}
          scroll={{ x: 1000 }} // Reduced width from 1200px to 1000px
          footer={() => !isArchivedTab ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{totalTransactions}</strong> active cases requiring review
              </div>
              <div>
                <Button type="link" size="small">
                  Export Cases
                </Button>
              </div>
            </div>
          ) : null}
        />

        <TransactionDetailsModal
          isVisible={isDetailsModalVisible}
          onClose={() => setIsDetailsModalVisible(false)}
          transactionId={selectedTransactionId}
        />
      </>
    );
  } catch (error) {
    console.error('Error rendering ActiveCasesTable:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Error loading table data. Please try refreshing the page.</p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }
});

export default ActiveCasesTable;