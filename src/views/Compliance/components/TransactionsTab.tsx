import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import { api } from '../../../api/api';
import { ComplianceTransaction, TransactionFilters, TransactionRecord, MonitoredAddress } from '../../../typings/compliance';
import ComplianceHeaderActions from './ComplianceHeaderActions';
import TransactionsTable from './TransactionsTable';
import EntityModal from './EntityModal';
import { useAppContext } from '../../../context/AppContext';
import { useAttribution } from '../../../context/AttributionContext';

interface TransactionsTabProps {
  monitoredAddresses: MonitoredAddress[];
  isLoading?: boolean;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  monitoredAddresses,
  // isLoading = false,
}) => {
  const { /*cases,*/ setCases } = useAppContext();
  const { fetchAttributions, attributions } = useAttribution();
  const [transactions, setTransactions] = useState<ComplianceTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [denom, setDenom] = useState<string>('USD');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<TransactionRecord | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 10
  });

  useEffect(() => {
    console.log(attributions);
  }, [attributions]);

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const response = await api.compliance.getTransactions(filters);
        setTransactions(response.transactions);
        setTotalTransactions(response.total);
        setCurrentPage(response.page);
        setPageSize(response.limit);
        const uniqueAddresses = new Set([
          ...response.transactions.flatMap(tx => [tx.monitoredAddressId.address, tx.counterpartyAddress])
        ]);
        fetchAttributions(Array.from(uniqueAddresses));
      } catch (error) {
        console.error('Failed to load transactions:', error);
        message.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [filters, fetchAttributions]);

  // Refresh cases from API whenever the component is mounted or after a case might have been created
  useEffect(() => {
    const refreshCases = async () => {
      try {
        const refreshedCases = await api.cases.getUserCases();
        setCases(refreshedCases);
      } catch (error) {
        console.error('Failed to refresh cases:', error);
      }
    };
    
    refreshCases();
  }, [setCases]);

  // Update the status in the state when dropdown changes
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.compliance.updateTransactionStatus(id, newStatus);

      // Update local state
      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction._id === id
            ? { ...transaction, status: newStatus, reviewer: 'Current User', reviewTimestamp: new Date().toISOString() }
            : transaction
        )
      );

      message.success(`Transaction status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      message.error('Failed to update transaction status');
    }
  };

  // Function to open modal when an entity is clicked
  const handleOpenEntity = (record: ComplianceTransaction) => {
    setSelectedEntity({
      _id: record._id,
      monitoredAddressId: record.monitoredAddressId._id,
      counterpartyAddress: record.counterpartyAddress,
      counterpartyEntity: attributions[record.counterpartyAddress]?.entity,
      blockchain: record.blockchain,
      amount: parseFloat(record.amount.toString()),
      timestamp: record.timestamp,
      riskScore: record.riskScore,
      status: record.status,
      reviewer: record.reviewer,
      reviewTimestamp: record.reviewTimestamp
    });
    setModalVisible(true);
  };

  // Handle pagination change
  const handleTableChange = (pagination: any) => {
    setFilters(prev => ({
      ...prev,
      page: pagination.current,
      limit: pagination.pageSize
    }));
  };

  return (
    <div>
      <ComplianceHeaderActions
        addressCount={monitoredAddresses.length}
        denom={denom}
        onDenomChange={setDenom}
      />
      
      <TransactionsTable
        transactions={transactions}
        totalTransactions={totalTransactions}
        currentPage={currentPage}
        pageSize={pageSize}
        loading={loading}
        denom={denom}
        onTableChange={handleTableChange}
        onStatusChange={handleStatusChange}
        onEntityClick={handleOpenEntity}
      />
      
      <EntityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        entity={selectedEntity}
      />
    </div>
  );
};

export default TransactionsTab; 