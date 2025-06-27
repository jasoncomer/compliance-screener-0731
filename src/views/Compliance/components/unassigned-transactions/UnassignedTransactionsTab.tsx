import React, { useState, useEffect, useMemo } from 'react';
import { Form } from 'antd';
import { TransactionFilters } from '../../../../typings/compliance';
import ComplianceHeaderActions from '../ComplianceHeaderActions';
import UnassignedTransactionsTable from './UnassignedTransactionsTable';
import { EntityModal } from '../../modals/EntityModal';
import BulkSelectComponent from '../BulkSelectComponent';
import FilterPanelComponent from '../FilterPanelComponent';
import { selectCurrentOrganization } from '../../../../store/slices/organizationsSlice';
import { useAppSelector } from '../../../../store/hooks';
import { 
  useComplianceTransactions
} from '../../../../hooks/useComplianceTransactions';


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
  const { data, isLoading: loading } = useComplianceTransactions(filters);
  
  // Memoize derived data to prevent unnecessary re-renders
  const transactions = useMemo(() => data?.transactions || [], [data?.transactions]);
  const totalTransactions = useMemo(() => data?.total || 0, [data?.total]);
  
  
  // Entity modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  
  // Bulk selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Track available filter options
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);


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

  // Update form when initialStatusFilter changes
  useEffect(() => {
    if (initialStatusFilter !== undefined) {
      // Update form to reflect the status filter
      if (initialStatusFilter) {
        form.setFieldsValue({ status: initialStatusFilter.split(',')[0] }); // Set first status for single select
      } else {
        form.setFieldsValue({ status: undefined });
      }
    }
  }, [initialStatusFilter, form]);

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
    // Handle pagination
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    
    // Handle sorting
    if (sorter && sorter.field) {
      if (sorter.order) {
        // Active sorting on a specific field
        setSortBy(sorter.field);
        setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
      } else {
        // Sorting cancelled
        if (sorter.field === 'timestamp') {
          // For timestamp, cycle to ascending when cancelled from descending
          if (sortBy === 'timestamp' && sortOrder === 'desc') {
            setSortBy('timestamp');
            setSortOrder('asc');
          } else {
            setSortBy('timestamp');
            setSortOrder('desc');
          }
        } else {
          // For other fields, reset to default
          setSortBy('timestamp');
          setSortOrder('desc');
        }
      }
    } else {
      // No sorter at all - reset to default if not already there
      if (sortBy !== 'timestamp' || sortOrder !== 'desc') {
        setSortBy('timestamp');
        setSortOrder('desc');
      }
    }
  };

  // Handle row selection change
  const handleSelectChange = (selectedKeys: React.Key[]) => {
    setSelectedRowKeys(selectedKeys);
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    setSelectedRowKeys([]);
  };

  // Handle bulk action completion (refetch handled automatically by React Query)
  const handleBulkActionComplete = async () => {
    // React Query will automatically refetch after mutations
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    form.resetFields();
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
    setFilters(mergedFilters);
  };

  // Handle clearing filters except status (called when compliance screener buttons are clicked)
  const handleClearFiltersExceptStatus = () => {
    setCurrentPage(1);
    setSortBy('timestamp');
    setSortOrder('desc');
    const newFilters = {
      page: 1,
      limit: pageSize,
      status: initialStatusFilter,
      sortBy: 'timestamp',
      sortOrder: 'desc' as const,
    };
    setFilters(newFilters);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ComplianceHeaderActions
        txCount={totalTransactions}
      />

      <BulkSelectComponent
        selectedRowKeys={selectedRowKeys}
        onClearSelection={handleClearSelection}
        onBulkActionComplete={handleBulkActionComplete}
      />
      
      <FilterPanelComponent
        form={form}
        availableBlockchains={availableBlockchains}
        showStatusFilter={true}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        initialStatusFilter={initialStatusFilter}
        onClearFiltersExceptStatus={handleClearFiltersExceptStatus}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <UnassignedTransactionsTable
          transactions={transactions}
          totalTransactions={totalTransactions}
          currentPage={currentPage}
          pageSize={pageSize}
          loading={loading}
          onTableChange={handleTableChange}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={handleSelectChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
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