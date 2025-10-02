import React, { useEffect, useMemo,useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Column,DataTable } from '@/components/ui/data-table';
import { Spinner } from '@/components/ui/spinner';

import { blockchain } from '../../../../api/blockchain';
import { useAttribution } from '../../../../context/AttributionContext';
import { useUpdateTransactionAssignee } from '../../../../hooks/useComplianceTransactions';
import { useCryptoPrices } from '../../../../hooks/useCryptoPrices';
import { calculateDetailedRiskAnalysis, calculateSimpleRiskScore, InputTransactionRiskData } from '../../../../services/inputTransactionRiskService';
import { useAppSelector } from '../../../../store/hooks';
import { selectActiveOrgMembers } from '../../../../store/slices/organizationsSlice';
import { EComplianceTransactionStatus, IComplianceTransaction } from '../../../../typings/compliance';
import { truncateAddress } from '../../../../utils/crypto';
import { getBlockchainLabel } from '../../../../utils/display-labels';
import { getUserDisplayName } from '../../../../utils/display-labels';
import { getComplianceReportStatusClassName } from '../../utils/compliance.utils';
import { currencySymbols } from '../CurrencySelector';

import { UnassignedTransactionModal } from './UnassignedTransactionModal';
import CreateCaseModal from '../cases/CreateCaseModal';

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
  // Transaction update callback
  onTransactionUpdate?: (updatedTransaction: IComplianceTransaction) => void;
  // Local transactions update callback
  onUpdateLocalTransactions?: (updater: (prev: IComplianceTransaction[]) => IComplianceTransaction[]) => void;
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
  sortBy: _sortBy = 'timestamp',
  sortOrder: _sortOrder = 'desc',
  onTransactionUpdate,
}) => {
  const denom = 'USD';
  const { attributions } = useAttribution();
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [_selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedTransactionData, setSelectedTransactionData] = useState<IComplianceTransaction | null>(null);
  const [isCreateCaseModalVisible, setIsCreateCaseModalVisible] = useState(false);
  const [caseTransactionData, setCaseTransactionData] = useState<IComplianceTransaction | null>(null);
  const { getPrice, prices } = useCryptoPrices();
  const [btcPrice, setBtcPrice] = useState<number>(0);
  
  // State for calculated risk scores
  const [calculatedRiskScores, setCalculatedRiskScores] = useState<Record<string, InputTransactionRiskData>>({});
  const [riskCalculationLoading, setRiskCalculationLoading] = useState<Record<string, boolean>>({});
  
  // Get organization members for the assign dropdown
  const organizationMembers = useAppSelector(selectActiveOrgMembers);
  
  // Convert organization members to team members format
  const teamMembers = useMemo(() => {
    return (organizationMembers || [])
      .filter(member => member.userId) // Filter out members without valid IDs
      .map(member => ({
        id: member.userId!,
        name: getUserDisplayName(member),
        role: String(member.role || 'Member')
      }));
  }, [organizationMembers]);

  // Assignment mutation
  const updateAssigneeMutation = useUpdateTransactionAssignee();

  // Handle assignment
  const handleAssign = async (assigneeId: string, notes?: string, status?: string) => {
    if (!selectedTransactionData) return;
    
    try {
      // Close the modal first
      setIsDetailsModalVisible(false);
      
      // Clear the selected transaction data
      setSelectedTransactionData(null);
      
      // Make the API call - this will update Redux store via the mutation
      await updateAssigneeMutation.mutateAsync({
        transactionId: selectedTransactionData._id,
        assignee: assigneeId,
        status: status
      });
      
      console.log('Transaction assigned successfully:', {
        transactionId: selectedTransactionData._id,
        assigneeId,
        notes,
        status
      });
    } catch (error) {
      console.error('Failed to assign transaction:', error);
      
      // If the API call fails, we could potentially restore the transaction
      // For now, we'll let React Query handle the refetch
    }
  };

  // Update BTC price when prices change
  useEffect(() => {
    try {
      const price = getPrice('BTC');
      if (price !== null) {
        setBtcPrice(price);
      }
    } catch (error) {
      console.error('Error getting BTC price:', error);
    }
  }, [prices, getPrice]);

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
  }, [transactions, attributions]);


  // Function to handle row click to show transaction details
  const handleRowClick = (record: IComplianceTransaction) => {
    setSelectedTransactionId(record._id);
    setSelectedTransactionData(record);
    setIsDetailsModalVisible(true);
  };

  // Function to handle transaction updates from the modal
  const handleTransactionUpdate = (updatedTransaction: IComplianceTransaction) => {
    console.log('Table received transaction update:', {
      transactionId: updatedTransaction._id,
      newRiskScores: updatedTransaction.riskScores,
      hasOnTransactionUpdate: !!onTransactionUpdate
    });
    
    // Update the selected transaction data
    setSelectedTransactionData(updatedTransaction);
    
    // If the transaction has updated risk scores, recalculate the risk
    if (updatedTransaction.riskScores && updatedTransaction.riskScores.length > 0) {
      // Clear any existing calculated risk for this transaction to force recalculation
      setCalculatedRiskScores(prev => {
        const newScores = { ...prev };
        delete newScores[updatedTransaction._id];
        return newScores;
      });
      
      // Trigger recalculation
      calculateRiskForTransaction(updatedTransaction);
    }
    
    // Notify parent component if callback provided
    if (onTransactionUpdate) {
      console.log('Table calling parent onTransactionUpdate');
      onTransactionUpdate(updatedTransaction);
    } else {
      console.log('Table has no parent onTransactionUpdate callback');
    }
  };

  // Configure row selection
  const rowSelection = {
    type: "checkbox" as const,
    selectedRowKeys,
    onChange: (keys: React.Key[]) => onSelectChange(keys),
  };

  const columns: Column<IComplianceTransaction>[] = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: EComplianceTransactionStatus) => (
        <Badge className={getComplianceReportStatusClassName(status)}>
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
        <span className="text-gray-900 dark:text-white">{clientId}</span>
      ),
    },
    {
      title: 'Counterparty Entity',
      dataIndex: 'counterpartyEntities',
      key: 'counterpartyEntities',
      width: 170,
      render: (counterpartyEntities: string[]) => {
        if (!counterpartyEntities.length) return (
          <span className="text-gray-400">N/A</span>
        );
        return (
          <span className="text-gray-600 dark:text-gray-400">
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
          <span className="text-gray-900 dark:text-white">{truncateAddress(txId)}</span>
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
        <span className="text-gray-900 dark:text-white">{getBlockchainLabel(blockchain)}</span>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      sorter: true,
      render: (amount: number) => (
        <div className="flex flex-col">
          <span className="text-gray-900 dark:text-white">BTC {(amount / 100000000)}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
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
        <span className="text-gray-600 dark:text-gray-400">{new Date(timestamp).toLocaleString()}</span>
      ),
      sorter: true,
    },
    {
      title: 'Risk Score',
      dataIndex: 'riskScores',
      key: 'riskScores',
      width: 80,
      sorter: true,
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
            <Badge className={riskData.className}>
              {calculatedRisk.overallRisk}
            </Badge>
          );
        }
        
        // Fallback to stored risk scores
        if (!scores || scores.length === 0) return 'N/A';
        const overallScore = scores[0] || 0;
        const riskData = calculateSimpleRiskScore([overallScore]);
        
        return (
          <Badge className={riskData.className}>
            {overallScore}
          </Badge>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record: IComplianceTransaction) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setCaseTransactionData(record);
              setIsCreateCaseModalVisible(true);
            }}
            disabled={record.status === 'UNASSIGNED'}
          >
            Create Case
          </Button>
        </div>
      ),
    },
  ];

  // Add error boundary for the table
  try {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <DataTable
          className="compliance-table w-full flex-1"
          dataSource={transactions}
          columns={columns}
          rowKey="_id"
          rowSelection={rowSelection}
          size="small"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalTransactions,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (page, size) => onTableChange({ current: page, pageSize: size }, {}, {})
          }}
          loading={loading}
          onChange={(pagination, sorter) => onTableChange(pagination, {}, sorter)}
          onRow={(record) => ({
            onClick: (event: React.MouseEvent) => {
              const target = event.target as HTMLElement;
              if (target.tagName.toLowerCase() !== 'input' && !target.closest('[role="checkbox"]')) {
                handleRowClick(record);
              }
            },
          })}
          scroll={{
            x: 1000,
            y: 'calc(100vh - 600px)'
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
        onAssign={handleAssign}
        teamMembers={teamMembers}
        onTransactionUpdate={handleTransactionUpdate}
        calculatedRiskScore={selectedTransactionData ? calculatedRiskScores[selectedTransactionData._id]?.overallRisk : undefined}
      />

      <CreateCaseModal
        isOpen={isCreateCaseModalVisible}
        onClose={() => {
          setIsCreateCaseModalVisible(false);
          setCaseTransactionData(null);
        }}
        transactionId={caseTransactionData?._id || ''}
        transactionTxId={caseTransactionData?.txId || ''}
        clientId={caseTransactionData?.clientId || ''}
        amount={caseTransactionData?.amount || 0}
      />

    </div>
    );
  } catch (error) {
    console.error('Error rendering UnassignedTransactionsTable:', error);
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Error loading table. Please refresh the page.</div>
        </div>
      </div>
    );
  }
};

export default UnassignedTransactionsTable; 