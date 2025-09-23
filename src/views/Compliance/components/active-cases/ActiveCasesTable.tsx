import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Check, Eye } from 'lucide-react';

import { blockchain } from '../../../../api/blockchain';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Column,DataTable } from '../../../../components/ui/data-table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Spinner } from '../../../../components/ui/spinner';
import { useAttribution } from '../../../../context/AttributionContext';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { calculateDetailedRiskAnalysis, calculateSimpleRiskScore, InputTransactionRiskData } from '../../../../services/inputTransactionRiskService';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updateTransactionAssignee, updateTransactionStatus } from '../../../../store/slices/complianceTransactionsSlice';
import { EComplianceTransactionStatus, IComplianceTransaction } from '../../../../typings/compliance';
import { IUser } from '../../../../typings/interfaces';
import { truncateAddress } from '../../../../utils/crypto';
import { getBlockchainLabel } from '../../../../utils/display-labels';
import AssignedTransactionDetailsModal from '../../modals/TransactionDetails/AssignedTransactionDetailsModal';
import { getComplianceReportStatusClassName } from '../../utils/compliance.utils';
import { currencySymbols } from '../CurrencySelector';
import TransactionRiskModal from '../modals/TransactionRiskModal';

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
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
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

  // Ensure transactions is an array and filter out invalid entries
  const validTransactions = useMemo(() => {
    return Array.isArray(transactions)
      ? transactions.filter(tx => tx && tx._id)
      : [];
  }, [transactions]);

  // Define columns for DataTable
  const columns: Column<IComplianceTransaction>[] = useMemo(() => [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'right',
      render: (status: EComplianceTransactionStatus) => (
        <div className="flex justify-end">
          <Badge className={getComplianceReportStatusClassName(status)}>
            {getStatusDisplayLabel(status) || 'Unknown'}
          </Badge>
        </div>
      ),
    },
    {
      title: 'Transaction ID',
      dataIndex: 'txId',
      key: 'txId',
      width: 180,
      align: 'right',
      render: (txId: string) => {
        if (!txId) return null;
        return (
          <div className="flex justify-end">
            <a
              href={`/home/block-explorer/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary"
            >
              {truncateAddress(txId)}
            </a>
          </div>
        );
      },
    },
    {
      title: 'Transaction Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      align: 'right',
      render: (timestamp: string | Date) => {
        if (!timestamp) return <span className="text-muted-foreground">N/A</span>;
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return <span className="text-muted-foreground">Invalid Date</span>;

        return (
          <div className="flex justify-end text-foreground">
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
      },
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
      align: 'right',
      render: (blockchain: string) => {
        if (!blockchain) return <span className="text-muted-foreground">Unknown</span>;
        return <span className="text-foreground">{getBlockchainLabel(blockchain)}</span>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      sorter: (a: IComplianceTransaction, b: IComplianceTransaction) => {
        const aAmount = typeof a.amount === 'number' ? a.amount : 0;
        const bAmount = typeof b.amount === 'number' ? b.amount : 0;
        return aAmount - bAmount;
      },
      render: (amount: number) => {
        if (typeof amount !== 'number' || isNaN(amount)) return <span className="text-muted-foreground">N/A</span>;
        const convertedAmount = ((amount / 100000000) * btcPrice);
        return (
          <div className="flex flex-col text-right">
            <span className="text-foreground">{(amount / 100000000).toFixed(8)} BTC</span>
            <span className="text-sm text-muted-foreground">
              {currencySymbols[denom]}
              {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      key: 'clientId',
      width: 120,
      align: 'right',
      render: (clientId: string) => (
        <span className="text-foreground">{clientId || 'N/A'}</span>
      ),
    },
    {
      title: 'Assigned To',
      dataIndex: 'reviewerId',
      key: 'reviewerId',
      width: 90,
      align: 'right',
      render: (reviewerId?: string) => (
        <span className="capitalize text-foreground">{getReviewerName(users, reviewerId)}</span>
      ),
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 120,
      align: 'right',
      render: (scores: number[], record: IComplianceTransaction) => {
        const txId = record._id;
        const calculatedRisk = calculatedRiskScores[txId];
        const isLoading = riskCalculationLoading[txId];

        // Show loading spinner if calculating
        if (isLoading) {
          return (
            <div className="flex items-center justify-center">
              <Spinner size="small" />
            </div>
          );
        }

        // Use calculated risk score if available, otherwise fall back to stored scores
        if (calculatedRisk) {
          const riskData = calculateSimpleRiskScore([calculatedRisk.overallRisk]);
          return (
            <div className="flex items-center justify-end gap-2">
              <Badge className={riskData.className}>
                {calculatedRisk.overallRisk}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => handleViewRisk(record, e)}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
          );
        }

        // Fallback to stored risk scores
        if (!scores || !Array.isArray(scores) || scores.length === 0) return 'N/A';
        const overallScore = scores[0] || 0;
        const riskData = calculateSimpleRiskScore([overallScore]);
        if (isNaN(riskData.score)) return 'N/A';
        return (
          <div className="flex items-center justify-end gap-2">
            <Badge className={riskData.className}>
              {overallScore}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => handleViewRisk(record, e)}
            >
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      title: 'Last Updated',
      dataIndex: 'reviewTimestamp',
      key: 'reviewTimestamp',
      width: 150,
      align: 'right',
      render: (reviewTimestamp?: Date) => {
        if (!reviewTimestamp) return <span className="text-muted-foreground">Not reviewed yet</span>;
        return <span className="text-foreground">{new Date(reviewTimestamp).toLocaleString()}</span>;
      },
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
      align: 'right',
      render: (_: any, record: IComplianceTransaction) => {
        if (!record || !record._id) return null;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="default"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(record);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                // Handle approve action
                dispatch(updateTransactionStatus({
                  transactionId: record._id,
                  status: EComplianceTransactionStatus.APPROVED
                }));
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
  ], [btcPrice, users, getReviewerName, handleViewDetails, handleViewRisk, calculatedRiskScores, riskCalculationLoading, dispatch, denom]);

  try {
    return (
      <>
        {/* Bulk Actions Bar */}
        {selectedRowKeys.length > 0 && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedRowKeys.length === validTransactions.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedRowKeys(validTransactions.map(tx => tx._id));
                  } else {
                    setSelectedRowKeys([]);
                  }
                }}
              />
              <span className="font-medium text-primary">
                {selectedRowKeys.length} transaction{selectedRowKeys.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
              >
                <Check className="mr-2 h-3 w-3" />
                Approve Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkInReview}
                disabled={bulkActionLoading}
              >
                In Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkReassign}
                disabled={bulkActionLoading}
              >
                Reassign Selected
              </Button>
            </div>
          </div>
        )}

        <DataTable
          className="compliance-table active-cases-table"
          dataSource={validTransactions}
          columns={columns}
          rowKey="_id"
          rowSelection={rowSelection}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalTransactions,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (page, size) => onTableChange({ current: page, pageSize: size })
          }}
          loading={loading}
          onChange={(pagination, sorter) => onTableChange({ ...pagination, sorter })}
          scroll={{ x: 1000 }}
          footer={!isArchivedTab ? () => (
            <div className="flex justify-between items-center">
              <div>
                <strong>{totalTransactions}</strong> active cases requiring review
              </div>
              <div>
                <Button variant="link" size="sm">
                  Export Cases
                </Button>
              </div>
            </div>
          ) : undefined}
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
        <Dialog open={isReassignModalVisible} onOpenChange={setIsReassignModalVisible}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign Transactions</DialogTitle>
              <DialogDescription>
                You are about to reassign <strong>{selectedRowKeys.length}</strong> transaction{selectedRowKeys.length !== 1 ? 's' : ''}.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              <p className="text-xs text-muted-foreground mb-2">Selected assignee: {selectedAssignee || 'None'}</p>
              {currentAssignees.size > 0 && (
                <p className="text-xs text-muted-foreground/70 mb-4">
                  Current assignees are excluded from the list below.
                </p>
              )}
              <div>
                <label className="block mb-2 font-medium">
                  Assign to:
                </label>
                <Select
                  value={selectedAssignee}
                  onValueChange={(value) => {
                    console.log('Selected assignee:', value);
                    setSelectedAssignee(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assignee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users && Object.values(users)
                      .filter(user => {
                        const userId = user._id;
                        return userId && !currentAssignees.has(userId);
                      })
                      .map((user, index) => {
                        const userId = user._id;
                        return (
                          <SelectItem
                            key={`user-${userId}-${index}`}
                            value={userId || ''}
                          >
                            {`${user.name} ${user.surname}`}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsReassignModalVisible(false);
                setSelectedAssignee('');
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReassign}
                disabled={!selectedAssignee || selectedAssignee === '' || bulkActionLoading}
              >
                {bulkActionLoading ? <Spinner size="small" /> : 'Reassign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  } catch (error) {
    console.error('Error rendering ActiveCasesTable:', error);
    return (
      <div className="p-5 text-center">
        <p>Error loading table data. Please try refreshing the page.</p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }
});

export default ActiveCasesTable;