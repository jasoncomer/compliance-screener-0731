import React, { useEffect, useState } from 'react';

import { FileSearch } from 'lucide-react';

import { cn } from '../../../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchComplianceTransactions,
  selectCompletedTransactions,
  selectComplianceFilters,
  selectIsLoading,
  selectPagination,
  setFilters,
  setLimit,
  setPage} from '../../../../store/slices/complianceTransactionsSlice';
import { selectCurrentOrganization } from '../../../../store/slices/organizationsSlice';
import { EComplianceTransactionStatus, TransactionFilters } from '../../../../typings/compliance';
import ActiveCasesTable from '../active-cases/ActiveCasesTable';
import ComplianceFilterPanel from '../ComplianceFilterPanel';

interface ArchivedCasesTabProps {
  isActive: boolean;
  className?: string;
}

const ARCHIVED_STATUSES = [
  EComplianceTransactionStatus.APPROVED,
  EComplianceTransactionStatus.CLOSED_WITH_NOTE,
  EComplianceTransactionStatus.CLOSED_WITH_SAR
];

const ArchivedCasesTab: React.FC<ArchivedCasesTabProps> = ({ isActive, className }) => {
  const organization = useAppSelector(selectCurrentOrganization);
  const dispatch = useAppDispatch();

  // Use Redux store data
  const transactions = useAppSelector(selectCompletedTransactions);
  const { total: totalTransactions, page: currentPage, limit: pageSize } = useAppSelector(selectPagination);
  const loading = useAppSelector(selectIsLoading);
  const filters = useAppSelector(selectComplianceFilters);

  // Track available filter options
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);

  // Load transactions from Redux store
  useEffect(() => {
    if (!isActive) return;

    const mergedFilters = {
      ...filters,
      page: currentPage,
      limit: pageSize,
      status: filters.status || ARCHIVED_STATUSES.join(',')
    };
    dispatch(fetchComplianceTransactions(mergedFilters));
  }, [dispatch, filters, organization, currentPage, pageSize, isActive]);

  // Extract unique filter options from transaction data
  useEffect(() => {
    if (transactions.length > 0) {
      // Extract unique blockchains
      const blockchains = [...new Set(transactions.map(tx => tx.blockchain))];
      setAvailableBlockchains(blockchains);
    }
  }, [transactions]);

  // Handle table change (pagination, sorting)
  const handleTableChange = (pagination: any) => {
    dispatch(setPage(pagination.current));
    dispatch(setLimit(pagination.pageSize));
  };

  // Handle filter changes from the filter panel
  const handleFilterChange = (newFilters: TransactionFilters) => {
    const mergedFilters = {
      ...newFilters,
      page: 1,
      limit: pageSize,
      sortBy: 'timestamp',
      sortOrder: 'desc' as const
    };

    // If no specific status is selected, show all archived statuses
    if (!newFilters.status) {
      mergedFilters.status = ARCHIVED_STATUSES.join(',');
    }

    console.log('ArchivedCasesTab - Sending filters to Redux:', mergedFilters);
    // Dispatch setFilters first, then use the mergedFilters directly to avoid race condition
    dispatch(setFilters(mergedFilters));
    dispatch(fetchComplianceTransactions(mergedFilters));
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(setFilters({
      page: 1,
      limit: pageSize,
      status: ARCHIVED_STATUSES.join(','),
      sortBy: 'timestamp',
      sortOrder: 'desc' as const
    }));
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-foreground flex items-center">
          <FileSearch className="mr-2 h-5 w-5" />
          Archived Cases Management ({totalTransactions})
        </h3>
        <div>
          <span className="mr-2.5 text-primary">
            Total Archived Cases: <strong>{totalTransactions}</strong>
          </span>
        </div>
      </div>

      {/* Filter Panel */}
      <ComplianceFilterPanel
        className="mb-4"
        showStatusFilter={true}
        showAssignedToFilter={true}
        showCounterpartyEntityFilter={true}
        showTransactionIdFilter={true}
        showBlockchainFilter={true}
        showClientIdFilter={true}
        showRiskLevelFilter={true}
        showAmountFilter={true}
        showDateRangeFilter={true}
        showReviewDateRangeFilter={true}
        statusOptions={[
          { value: EComplianceTransactionStatus.APPROVED, label: 'Approved' },
          { value: EComplianceTransactionStatus.CLOSED_WITH_NOTE, label: 'Approved with Note' },
          { value: EComplianceTransactionStatus.CLOSED_WITH_SAR, label: 'Closed with SAR' }
        ]}
        availableBlockchains={availableBlockchains}
        defaultStatus={ARCHIVED_STATUSES}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        applyOnChange={true}
      />

      <ActiveCasesTable
        transactions={transactions}
        totalTransactions={totalTransactions}
        currentPage={currentPage}
        pageSize={pageSize}
        loading={loading}
        onTableChange={handleTableChange}
        isArchivedTab={true}
      />
    </div>
  );
};

export default ArchivedCasesTab;