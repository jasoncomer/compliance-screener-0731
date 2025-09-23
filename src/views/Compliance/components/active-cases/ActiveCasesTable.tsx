import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Table, Tag, Button, Space, Tooltip, Spin, Checkbox, Modal, Select } from 'antd';
import { EyeOutlined, CheckOutlined } from '@ant-design/icons';
import { EComplianceTransactionStatus, IComplianceTransaction } from '../../../../typings/compliance';
import AssignedTransactionDetailsModal from '../../modals/TransactionDetails/AssignedTransactionDetailsModal';
import TransactionRiskModal from '../modals/TransactionRiskModal';
import { conversionRates, currencySymbols } from '../CurrencySelector';
import { getComplianceReportStatusColor } from '../../utils/compliance.utils';
import { calculateSimpleRiskScore, calculateDetailedRiskAnalysis, InputTransactionRiskData } from '../../../../services/inputTransactionRiskService';
import { getBlockchainLabel } from '../../../../utils/display-labels';
import { truncateAddress } from '../../../../utils/crypto';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { updateTransactionAssignee, updateTransactionStatus } from '../../../../store/slices/complianceTransactionsSlice';
import { IUser } from '../../../../typings/interfaces';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { useAttribution } from '../../../../context/AttributionContext';
import { blockchain } from '../../../../api/blockchain';
import '../../../../styles/transactionGrouping.css';

// Status mapping for display labels
const getStatusDisplayLabel = (status: EComplianceTransactionStatus): string => {
  const statusMap: Record<EComplianceTransactionStatus, string> = {
    [EComplianceTransactionStatus.UNASSIGNED]: 'Unassigned',
    [EComplianceTransactionStatus.UNREVIEWED]: 'Unreviewed',
    [EComplianceTransactionStatus.IN_REVIEW]: 'In Review',
    [EComplianceTransactionStatus.APPROVED]: 'Approved',
    [EComplianceTransactionStatus.HOLD]: 'Hold',
    [EComplianceTransactionStatus.CLOSED_WITH_NOTE]: 'Approved with Note',
    [EComplianceTransactionStatus.CLOSED_WITH_SAR]: 'Closed with SAR',
  };
  return statusMap[status] || status;
};

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
  const [isRiskModalVisible, setIsRiskModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<IComplianceTransaction | null>(null);
  const dispatch = useAppDispatch();
  const { users } = useAppSelector(state => state.organizations);
  const { getPrice } = useCryptoPrices();
  
  const btcPrice = getPrice('BTC') || 0;
  
  // State for calculated risk scores
  const [calculatedRiskScores, setCalculatedRiskScores] = useState<Record<string, InputTransactionRiskData>>({});
  const [riskCalculationLoading, setRiskCalculationLoading] = useState<Record<string, boolean>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [isReassignModalVisible, setIsReassignModalVisible] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const { attributions } = useAttribution();

  // Get current assignees from selected transactions to exclude them from reassignment options
  const currentAssignees = useMemo(() => {
    if (selectedRowKeys.length === 0) return new Set();
    const assignees = new Set<string>();
    selectedRowKeys.forEach(transactionId => {
      const transaction = transactions.find(tx => tx._id === transactionId);
      if (transaction?.reviewerId) {
        assignees.add(transaction.reviewerId);
      }
    });
    return assignees;
  }, [selectedRowKeys, transactions]);

  // Debug users data (removed excessive logging)

  // Function to handle row click to show transaction details
  const handleViewDetails = useCallback((record: IComplianceTransaction) => {
    if (!record || !record._id) {
      console.warn('Invalid transaction record:', record);
      return;
    }
    setSelectedTransactionId(record._id);
    setIsDetailsModalVisible(true);
  }, []);

  // Function to handle risk modal opening
  const handleViewRisk = useCallback((record: IComplianceTransaction, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click
    if (!record || !record._id) {
      console.warn('Invalid transaction record:', record);
      return;
    }
    setSelectedTransaction(record);
    setIsRiskModalVisible(true);
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

  // Bulk action handlers
  const handleBulkApprove = useCallback(async () => {
    if (selectedRowKeys.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      // Update each selected transaction to APPROVED status
      const updatePromises = selectedRowKeys.map(transactionId => 
        dispatch(updateTransactionStatus({
          transactionId: transactionId as string,
          status: EComplianceTransactionStatus.APPROVED
        })).unwrap()
      );
      
      await Promise.all(updatePromises);
      console.log('Successfully approved transactions:', selectedRowKeys);
      
      // Clear selection after successful update
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Error bulk approving transactions:', error);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedRowKeys, dispatch]);

  const handleBulkInReview = useCallback(async () => {
    if (selectedRowKeys.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      // Update each selected transaction to IN_REVIEW status
      const updatePromises = selectedRowKeys.map(transactionId => 
        dispatch(updateTransactionStatus({
          transactionId: transactionId as string,
          status: EComplianceTransactionStatus.IN_REVIEW
        })).unwrap()
      );
      
      await Promise.all(updatePromises);
      console.log('Successfully set transactions to in review:', selectedRowKeys);
      
      // Clear selection after successful update
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Error bulk setting transactions to in review:', error);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedRowKeys, dispatch]);

  const handleBulkReassign = useCallback(() => {
    if (selectedRowKeys.length === 0) return;
    setIsReassignModalVisible(true);
  }, [selectedRowKeys]);

  const handleConfirmReassign = useCallback(async () => {
    if (selectedRowKeys.length === 0 || !selectedAssignee) return;
    
    setBulkActionLoading(true);
    try {
      // Update each selected transaction's assignee
      const updatePromises = selectedRowKeys.map(transactionId => 
        dispatch(updateTransactionAssignee({
          transactionId: transactionId as string,
          assignee: selectedAssignee
        })).unwrap()
      );
      
      await Promise.all(updatePromises);
      console.log('Successfully reassigned transactions:', selectedRowKeys, 'to:', selectedAssignee);
      
      // Clear selection and close modal after successful update
      setSelectedRowKeys([]);
      setIsReassignModalVisible(false);
      setSelectedAssignee('');
    } catch (error) {
      console.error('Error bulk reassigning transactions:', error);
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedRowKeys, selectedAssignee, dispatch]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: IComplianceTransaction) => ({
      name: record._id,
    }),
  };

  // Safe render functions with error handling
  const renderStatus = (status: EComplianceTransactionStatus) => {
    try {
      return (
        <div style={{ display: 'flex', justifyContent: 'right' }}>
          <Tag color={getComplianceReportStatusColor(status)} style={{ fontWeight: 'bold' }}>
            {getStatusDisplayLabel(status) || 'Unknown'}
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
          <a 
            href={`/home/block-explorer/transaction/${txId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            {truncateAddress(txId)}
          </a>
        </div>
      );
    } catch (error) {
      console.error('Error rendering transaction ID:', error);
      return <div className="text-gray-900 dark:text-white">Error</div>;
    }
  };

  const renderBlockchain = (blockchain: string) => {
    try {
      if (!blockchain) return <span className="text-gray-600 dark:text-gray-400">Unknown</span>;
      return <span className="text-gray-900 dark:text-white">{getBlockchainLabel(blockchain)}</span>;
    } catch (error) {
      console.error('Error rendering blockchain:', error);
      return <span className="text-gray-900 dark:text-white">Error</span>;
    }
  };

  const renderTransactionTimestamp = (timestamp: string | Date) => {
    try {
      if (!timestamp) return <span className="text-gray-600 dark:text-gray-400">N/A</span>;
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return <span className="text-gray-600 dark:text-gray-400">Invalid Date</span>;
      
      return (
        <div style={{ display: 'flex', justifyContent: 'right' }} className="text-gray-900 dark:text-white">
          <span className="text-sm">
            {date.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}
          </span>
        </div>
      );
    } catch (error) {
      console.error('Error rendering transaction timestamp:', error);
      return <div className="text-gray-900 dark:text-white">Error</div>;
    }
  };

  const renderAmount = (amount: number) => {
    try {
      if (typeof amount !== 'number' || isNaN(amount)) return <span className="text-gray-600 dark:text-gray-400">N/A</span>;
      const convertedAmount = ((amount / 100000000) * btcPrice);
      return (
        <div className="flex flex-col text-right">
          <span className="text-gray-900 dark:text-white">{(amount / 100000000).toFixed(8)} BTC</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currencySymbols[denom]}
            {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
        </div>
      );
    } catch (error) {
      console.error('Error rendering amount:', error);
      return <div className="text-gray-900 dark:text-white">Error</div>;
    }
  };


  const renderReviewer = (reviewerId?: string) => {
    try {
      return <span className="capitalize text-gray-900 dark:text-white">{getReviewerName(users, reviewerId)}</span>;
    } catch (error) {
      console.error('Error rendering reviewer:', error);
      return <span className="text-gray-900 dark:text-white">Error</span>;
    }
  };

  // Calculate risk scores for transactions
  const calculateRiskForTransaction = async (transaction: IComplianceTransaction) => {
    const txId = transaction._id;
    
    // Skip if already calculated or currently calculating
    if (calculatedRiskScores[txId] || riskCalculationLoading[txId]) {
      return;
    }

    setRiskCalculationLoading(prev => ({ ...prev, [txId]: true }));

    try {
      // Fetch transaction details to get input addresses
      const txData = await blockchain.getTransaction(transaction.txId);
      const inputAddresses = txData.inputs.map(input => input.addr).filter(Boolean);
      
      if (inputAddresses.length === 0) {
        console.warn(`No input addresses found for transaction ${transaction.txId}`);
        return;
      }

      // Calculate detailed risk analysis
      const riskData = await calculateDetailedRiskAnalysis(inputAddresses);

      setCalculatedRiskScores(prev => ({ ...prev, [txId]: riskData }));
    } catch (error) {
      console.error(`Error calculating risk for transaction ${transaction.txId}:`, error);
    } finally {
      setRiskCalculationLoading(prev => ({ ...prev, [txId]: false }));
    }
  };

  // Calculate risk scores when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      // Calculate risk for transactions that don't have calculated scores yet
      transactions.forEach(transaction => {
        if (!calculatedRiskScores[transaction._id] && !riskCalculationLoading[transaction._id]) {
          calculateRiskForTransaction(transaction);
        }
      });
    }
  }, [transactions, calculatedRiskScores, riskCalculationLoading, attributions]);

  const renderRiskScore = (scores: number[], record: IComplianceTransaction) => {
    try {
      const txId = record._id;
      const calculatedRisk = calculatedRiskScores[txId];
      const isLoading = riskCalculationLoading[txId];
      
      // Show loading spinner if calculating
      if (isLoading) {
        return (
          <div className="flex items-center justify-center">
            <Spin size="small" />
          </div>
        );
      }
      
      // Use calculated risk score if available, otherwise fall back to stored scores
      if (calculatedRisk) {
        const riskData = calculateSimpleRiskScore([calculatedRisk.overallRisk]);
        return (
          <Space>
            <Tag color={riskData.color} style={{ fontWeight: 'bold' }}>
              {calculatedRisk.overallRisk}
            </Tag>
            <Tooltip title="View detailed risk analysis">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => handleViewRisk(record, e)}
                style={{ padding: '0 4px' }}
              />
            </Tooltip>
          </Space>
        );
      }
      
      // Fallback to stored risk scores
      if (!scores || !Array.isArray(scores) || scores.length === 0) return 'N/A';
      const overallScore = scores[0] || 0;
      const riskData = calculateSimpleRiskScore([overallScore]);
      if (isNaN(riskData.score)) return 'N/A';
      return (
        <Space>
          <Tag color={riskData.color} style={{ fontWeight: 'bold' }}>
            {overallScore}
          </Tag>
          <Tooltip title="View detailed risk analysis">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => handleViewRisk(record, e)}
              style={{ padding: '0 4px' }}
            />
          </Tooltip>
        </Space>
      );
    } catch (error) {
      console.error('Error rendering risk score:', error);
      return <div>Error</div>;
    }
  };

  const renderLastUpdated = (reviewTimestamp?: Date) => {
    try {
      if (!reviewTimestamp) return <span className="text-gray-600 dark:text-gray-400">Not reviewed yet</span>;
      return <span className="text-gray-900 dark:text-white">{new Date(reviewTimestamp).toLocaleString()}</span>;
    } catch (error) {
      console.error('Error rendering last updated:', error);
      return <span className="text-gray-900 dark:text-white">Error</span>;
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
      align: 'right' as const,
      render: renderStatus,
    },
    {
      title: 'Transaction ID',
      dataIndex: 'txId',
      key: 'txId',
      width: 180,
      align: 'right' as const,
      render: renderTransactionId,
    },
    {
      title: 'Transaction Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      align: 'right' as const,
      render: renderTransactionTimestamp,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => {
        if (!a.timestamp) return -1;
        if (!b.timestamp) return 1;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      },
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      width: 100,
      align: 'right' as const,
      render: renderBlockchain,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => {
        const aAmount = typeof a.amount === 'number' ? a.amount : 0;
        const bAmount = typeof b.amount === 'number' ? b.amount : 0;
        return aAmount - bAmount;
      },
      render: renderAmount,
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      key: 'clientId',
      width: 120,
      align: 'right' as const,
      render: (clientId: string) => (
        <span className="text-gray-900 dark:text-white">{clientId || 'N/A'}</span>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'reviewerId',
      key: 'reviewerId',
      width: 90,
      align: 'right' as const,
      render: renderReviewer,
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 72,
      align: 'right' as const,
      render: (scores: number[], record: IComplianceTransaction) => renderRiskScore(scores, record),
    },
    {
      title: 'Last Updated',
      dataIndex: 'reviewTimestamp',
      key: 'reviewTimestamp',
      width: 150,
      align: 'right' as const,
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
      width: 90,
      align: 'right' as const,
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
            </Space>
          );
        } catch (error) {
          console.error('Error rendering actions:', error);
          return <div>Error</div>;
        }
      },
    },
  ], [renderStatus, renderTransactionId, renderBlockchain, renderAmount, renderReviewer, renderRiskScore, renderLastUpdated, handleViewDetails, denom, conversionRates]);

  try {
    return (
      <>
        {/* Bulk Actions Bar */}
        {selectedRowKeys.length > 0 && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px 16px', 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                checked={selectedRowKeys.length === validTransactions.length}
                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < validTransactions.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRowKeys(validTransactions.map(tx => tx._id));
                  } else {
                    setSelectedRowKeys([]);
                  }
                }}
              />
              <span style={{ fontWeight: '500', color: '#0c4a6e' }}>
                {selectedRowKeys.length} transaction{selectedRowKeys.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="primary"
                size="small"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                icon={<CheckOutlined />}
                onClick={handleBulkApprove}
                loading={bulkActionLoading}
              >
                Approve Selected
              </Button>
              <Button
                size="small"
                onClick={handleBulkInReview}
                loading={bulkActionLoading}
              >
                In Review
              </Button>
              <Button
                size="small"
                onClick={handleBulkReassign}
                loading={bulkActionLoading}
              >
                Reassign Selected
              </Button>
            </div>
          </div>
        )}

        <Table
          className="compliance-table active-cases-table"
          dataSource={validTransactions}
          columns={columns}
          rowKey="_id"
          rowSelection={rowSelection}
          rowClassName={(_record, index) => {
            // Use index-based alternating row colors instead of txId-based grouping
            return index % 2 === 0 ? 'table-row-even' : 'table-row-odd';
          }}
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

        <AssignedTransactionDetailsModal
          isVisible={isDetailsModalVisible}
          onClose={() => setIsDetailsModalVisible(false)}
          transactionId={selectedTransactionId}
          calculatedRiskScore={selectedTransactionId ? calculatedRiskScores[selectedTransactionId]?.overallRisk : undefined}
          onReassign={async (reviewerId, notes) => {
            if (!selectedTransactionId || !reviewerId) {
              console.error('Missing transaction ID or reviewer ID for reassignment');
              return;
            }

            try {
              console.log('Reassigning transaction:', selectedTransactionId, 'to:', reviewerId, 'notes:', notes);
              
              // Dispatch the reassignment action
              await dispatch(updateTransactionAssignee({
                transactionId: selectedTransactionId,
                assignee: reviewerId
              })).unwrap();

              // Close the modal after successful reassignment
              setIsDetailsModalVisible(false);
              setSelectedTransactionId(null);
              
              console.log('Transaction reassigned successfully');
            } catch (error) {
              console.error('Failed to reassign transaction:', error);
              // You might want to show a toast notification here
            }
          }}
        />

        <TransactionRiskModal
          visible={isRiskModalVisible}
          onClose={() => setIsRiskModalVisible(false)}
          transaction={selectedTransaction}
          title="Transaction Risk Analysis"
          attributions={attributions}
          itemsMap={{}}
        />

        {/* Bulk Reassign Modal */}
        <Modal
          title="Reassign Transactions"
          open={isReassignModalVisible}
          onCancel={() => {
            setIsReassignModalVisible(false);
            setSelectedAssignee('');
          }}
          onOk={handleConfirmReassign}
          confirmLoading={bulkActionLoading}
          okText="Reassign"
          cancelText="Cancel"
          okButtonProps={{ disabled: !selectedAssignee || selectedAssignee === '' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <p>You are about to reassign <strong>{selectedRowKeys.length}</strong> transaction{selectedRowKeys.length !== 1 ? 's' : ''}.</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Selected assignee: {selectedAssignee || 'None'}</p>
            {currentAssignees.size > 0 && (
              <p style={{ fontSize: '12px', color: '#999' }}>
                Current assignees are excluded from the list below.
              </p>
            )}
          </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Assign to:
              </label>
              <Select
                placeholder="Select assignee..."
                value={selectedAssignee}
                onChange={(value) => {
                  console.log('Selected assignee:', value);
                  setSelectedAssignee(value);
                }}
                style={{ width: '100%' }}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                  const text = String(option?.children || '');
                  return text.toLowerCase().includes(input.toLowerCase());
                }}
                allowClear={false}
                notFoundContent="No users found"
              >
                {users && Object.values(users)
                  .filter(user => {
                    const userId = user._id;
                    return userId && !currentAssignees.has(userId);
                  })
                  .map((user, index) => {
                    const userId = user._id;
                    return (
                      <Select.Option 
                        key={`user-${userId}-${index}`} 
                        value={userId}
                      >
                        {`${user.name} ${user.surname}`}
                      </Select.Option>
                    );
                  })}
              </Select>
            </div>
        </Modal>
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