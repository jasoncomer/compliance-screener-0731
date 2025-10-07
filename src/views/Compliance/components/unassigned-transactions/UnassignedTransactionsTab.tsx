import React, { useEffect, useMemo, useState } from 'react';

import {
  useComplianceTransactions
} from '../../../../hooks/useComplianceTransactions';
import { useAppSelector } from '../../../../store/hooks';
import { selectCurrentOrganization } from '../../../../store/slices/organizationsSlice';
import { IComplianceTransaction, TransactionFilters } from '../../../../typings/compliance';
import { EntityModal } from '../../modals/EntityModal';
import BulkSelectComponent from '../BulkSelectComponent';
import ComplianceFilterPanel from '../ComplianceFilterPanel';
import ComplianceHeaderActions from '../ComplianceHeaderActions';

import UnassignedTransactionsTable from './UnassignedTransactionsTable';

interface UnassignedTransactionsTabProps {
  initialStatusFilter?: string;
}

const UnassignedTransactionsTab: React.FC<UnassignedTransactionsTabProps> = ({ initialStatusFilter }) => {
  const organization = useAppSelector(selectCurrentOrganization);

  // Local state for pagination, sorting, and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<TransactionFilters>({
    status: initialStatusFilter,
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
  });

  // Use React Query for data fetching
  const { data, isLoading: loading, error } = useComplianceTransactions(filters);

  // Debug logging
  useEffect(() => {
    console.log('UnassignedTransactionsTab - Debug Info:', {
      organization: organization?.name || 'No organization',
      organizationId: organization?._id || 'No organization ID',
      filters,
      loading,
      error: error?.message || 'No error',
      data: data ? {
        transactionsCount: data.transactions?.length || 0,
        total: data.total || 0,
        page: data.page || 0,
        limit: data.limit || 0
      } : 'No data'
    });
  }, [organization, filters, loading, error, data]);

  // Memoize derived data to prevent unnecessary re-renders
  const rawTransactions = useMemo(() => data?.transactions || [], [data?.transactions]);
  const totalTransactions = useMemo(() => {
    const total = data?.total || 0;
    console.log('Total transactions calculated:', total, 'from data:', data);
    return total;
  }, [data?.total]);

  // Use raw transactions directly - filtering is handled by the API
  const transactions = useMemo(() => rawTransactions, [rawTransactions]);

  // Sync local transactions with fetched data
  useEffect(() => {
    console.log('Syncing local transactions with fetched data:', {
      fetchedCount: transactions.length,
      localCount: localTransactions.length
    });
    setLocalTransactions(transactions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  // Entity modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Bulk selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Track available filter options
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);

  // Local state for transactions to allow updates
  const [localTransactions, setLocalTransactions] = useState<IComplianceTransaction[]>([]);

  // Update filters when dependencies change
  useEffect(() => {
    setFilters(prevFilters => {
      const newFilters = {
        ...prevFilters,
        status: initialStatusFilter,
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      return newFilters;
    });
  }, [organization, currentPage, pageSize, initialStatusFilter, sortBy, sortOrder]);

  // Update filters when initialStatusFilter changes
  useEffect(() => {
    if (initialStatusFilter !== undefined) {
      // Update filters to reflect the status filter
      if (initialStatusFilter) {
        setFilters(prev => ({ ...prev, status: initialStatusFilter.split(',')[0] }));
      } else {
        setFilters(prev => ({ ...prev, status: undefined }));
      }
    }
  }, [initialStatusFilter]);

  // Extract unique filter options from transaction data
  useEffect(() => {
    if (transactions.length > 0) {
      // Extract unique blockchains
      const blockchains = [...new Set(transactions.map(tx => tx.blockchain))];
      setAvailableBlockchains(blockchains);
    }
  }, [transactions, initialStatusFilter]);

  // Handle table change (pagination, sorting)
  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    console.log('handleTableChange called with:', { pagination, sorter });
    
    // Handle pagination
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);

    // Handle sorting
    let newSortBy = sortBy;
    let newSortOrder = sortOrder;
    
    if (sorter && sorter.field) {
      if (sorter.order) {
        // Active sorting on a specific field
        newSortBy = sorter.field;
        newSortOrder = sorter.order === 'ascend' ? 'asc' : 'desc';
      } else {
        // Sorting cancelled
        if (sorter.field === 'timestamp') {
          // For timestamp, cycle to ascending when cancelled from descending
          if (sortBy === 'timestamp' && sortOrder === 'desc') {
            newSortBy = 'timestamp';
            newSortOrder = 'asc';
          } else {
            newSortBy = 'timestamp';
            newSortOrder = 'desc';
          }
        } else {
          // For other fields, reset to default
          newSortBy = 'timestamp';
          newSortOrder = 'desc';
        }
      }
    } else {
      // No sorter at all - reset to default if not already there
      if (sortBy !== 'timestamp' || sortOrder !== 'desc') {
        newSortBy = 'timestamp';
        newSortOrder = 'desc';
      }
    }

    // Update sort state
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);

    // Update filters with new pagination and sorting values
    const newFilters = {
      ...filters,
      page: pagination.current,
      limit: pagination.pageSize,
      sortBy: newSortBy,
      sortOrder: newSortOrder,
    };
    console.log('Updating filters to:', newFilters);
    setFilters(newFilters);
  };

  // Handle row selection change
  const handleSelectChange = (selectedKeys: React.Key[]) => {
    setSelectedRowKeys(selectedKeys);
  };

  // Handle transaction updates from the table
  const handleTransactionUpdate = (updatedTransaction: IComplianceTransaction) => {
    console.log('Tab received transaction update:', {
      transactionId: updatedTransaction._id,
      newRiskScores: updatedTransaction.riskScores,
      currentLocalTransactionsCount: localTransactions.length
    });

    setLocalTransactions(prevTransactions => {
      const updated = prevTransactions.map(tx =>
        tx._id === updatedTransaction._id ? updatedTransaction : tx
      );

      const updatedTx = updated.find(tx => tx._id === updatedTransaction._id);
      console.log('Updated local transactions:', {
        beforeCount: prevTransactions.length,
        afterCount: updated.length,
        updatedTransaction: updatedTx,
        oldRiskScores: prevTransactions.find(tx => tx._id === updatedTransaction._id)?.riskScores,
        newRiskScores: updatedTx?.riskScores
      });

      return updated;
    });
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    setSelectedRowKeys([]);
  };

  // Handle bulk action completion (refetch handled automatically by React Query)
  const handleBulkActionComplete = async () => {
    // React Query will automatically refetch after mutations
  };

  // Calculate the number of items visible on the current page
  const currentPageItemsCount = useMemo(() => {
    if (!localTransactions || localTransactions.length === 0) {
      return 0;
    }
    
    // Calculate the actual number of items on the current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, localTransactions.length);
    const count = endIndex - startIndex;
    
    return Math.max(0, count);
  }, [localTransactions, currentPage, pageSize]);

  // Handle select all functionality
  const handleSelectAll = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPageItems = localTransactions.slice(startIndex, endIndex);
    const allKeys = currentPageItems.map(transaction => transaction._id);
    setSelectedRowKeys(allKeys);
  };

  // Handle filter changes from the filter panel
  const handleFilterChange = (newFilters: TransactionFilters) => {
    setCurrentPage(1); // Reset to first page when filtering
    const mergedFilters = {
      ...newFilters,
      status: initialStatusFilter || newFilters.status,
      page: 1,
      limit: pageSize,
      sortBy,
      sortOrder,
    };
    
    // Log the filters being sent to API
    console.log('Sending filters to API:', mergedFilters);
    console.log('Counterparty Entity filter value:', newFilters.counterpartyEntity);
    setFilters(mergedFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setCurrentPage(1);
    setSortBy('timestamp');
    setSortOrder('desc');
    const newFilters = {
      status: initialStatusFilter,
      page: 1,
      limit: pageSize,
      sortBy: 'timestamp',
      sortOrder: 'desc' as const,
    };
    setFilters(newFilters);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">Error loading transactions</div>
          <p className="mt-2 text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-600 text-lg font-semibold">No transactions found</div>
          <p className="mt-2 text-gray-500">
            {organization 
              ? "No unassigned transactions found for your organization." 
              : "Please ensure you have access to an organization."
            }
          </p>
          <div className="mt-4 text-sm text-gray-400">
            <p>Debug info:</p>
            <p>Organization: {organization?.name || 'None'}</p>
            <p>Filters: {JSON.stringify(filters)}</p>
            <p>Total from API: {totalTransactions}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ComplianceHeaderActions
        txCount={totalTransactions}
      />

      <ComplianceFilterPanel
        className="mb-4"
        showStatusFilter={false}
        showAssignedToFilter={false}
        showCounterpartyEntityFilter={true}
        showTransactionIdFilter={true}
        showBlockchainFilter={true}
        showClientIdFilter={true}
        showRiskLevelFilter={true}
        showAmountFilter={true}
        showDateRangeFilter={true}
        availableBlockchains={availableBlockchains}
        defaultStatus={initialStatusFilter}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        applyOnChange={true}
      />

      {/* Bulk Selection Component - shown when items are selected */}
      {selectedRowKeys.length > 0 && (
        <BulkSelectComponent
          selectedRowKeys={selectedRowKeys}
          onClearSelection={handleClearSelection}
          onSelectAll={handleSelectAll}
          totalItems={currentPageItemsCount}
          onBulkActionComplete={handleBulkActionComplete}
        />
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <UnassignedTransactionsTable
          transactions={localTransactions}
          totalTransactions={totalTransactions}
          currentPage={currentPage}
          pageSize={pageSize}
          loading={loading}
          onTableChange={handleTableChange}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={handleSelectChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onTransactionUpdate={handleTransactionUpdate}
          onUpdateLocalTransactions={setLocalTransactions}
        />
      </div>

      {/* Entity Modal */}
      <EntityModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        entity={null}
      />
    </div>
  );
};

export default UnassignedTransactionsTab;