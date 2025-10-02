import React, { useEffect, useState } from 'react';

import { FileSearch } from 'lucide-react';

import ErrorBoundary from '../../../../components/ErrorBoundary';
import { cn } from '../../../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  fetchComplianceTransactions,
  selectActiveTransactions,
  selectComplianceFilters,
  selectIsLoading,
  selectPagination,
  setFilters,
  setLimit,
  setPage} from '../../../../store/slices/complianceTransactionsSlice';
import { selectCurrentOrganization } from '../../../../store/slices/organizationsSlice';
import { EComplianceTransactionStatus, TransactionFilters } from '../../../../typings/compliance';
import ComplianceFilterPanel from '../ComplianceFilterPanel';

import ActiveCasesTable from './ActiveCasesTable';

const ACTIVE_STATUSES = [
  EComplianceTransactionStatus.UNREVIEWED,
  EComplianceTransactionStatus.IN_REVIEW,
  EComplianceTransactionStatus.HOLD
];

interface ActiveCasesTabProps {
  isActive: boolean;
  className?: string;
}

const ActiveCasesTab: React.FC<ActiveCasesTabProps> = ({ isActive, className }) => {
  const organization = useAppSelector(selectCurrentOrganization);
  const dispatch = useAppDispatch();

  // Use Redux store data
  const transactions = useAppSelector(selectActiveTransactions);
  const { total: totalTransactions, page: currentPage, limit: pageSize } = useAppSelector(selectPagination);
  const loading = useAppSelector(selectIsLoading);
  const filters = useAppSelector(selectComplianceFilters);

  // Track available filter options
  const [availableBlockchains, setAvailableBlockchains] = useState<string[]>([]);

  // Validate and sanitize transactions data
  const validatedTransactions = React.useMemo(() => {
    if (!Array.isArray(transactions)) {
      console.warn('Transactions is not an array:', transactions);
      return [];
    }

    return transactions.filter(tx => {
      if (!tx || typeof tx !== 'object') {
        console.warn('Invalid transaction object:', tx);
        return false;
      }

      if (!tx._id || typeof tx._id !== 'string') {
        console.warn('Transaction missing _id:', tx);
        return false;
      }

      return true;
    });
  }, [transactions]);

  // Load transactions from Redux store
  useEffect(() => {
    if (!isActive) return;

    const mergedFilters = {
      ...filters,
      status: filters.status || ACTIVE_STATUSES.join(','), // Use default only if no status filter is set
      page: currentPage,
      limit: pageSize
    };
    dispatch(fetchComplianceTransactions(mergedFilters));
  }, [dispatch, filters, organization, currentPage, pageSize, isActive]);

  // Extract unique filter options from transaction data
  useEffect(() => {
    if (validatedTransactions.length > 0) {
      // Extract unique blockchains
      const blockchains = [...new Set(validatedTransactions.map(tx => tx.blockchain).filter(Boolean))];
      setAvailableBlockchains(blockchains);
    }
  }, [validatedTransactions]);

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
      limit: pageSize
    };

    // If no specific status is selected, show all active statuses
    if (!newFilters.status) {
      mergedFilters.status = ACTIVE_STATUSES.join(',');
    }

    dispatch(setFilters(mergedFilters));
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(setFilters({
      page: 1,
      limit: pageSize,
      status: ACTIVE_STATUSES.join(',') // Reset to default active statuses when clearing
    }));
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-gray-300">
        <h3 className="m-0 text-black dark:text-white flex items-center">
          <FileSearch className="mr-2 h-5 w-5" />
          Case Management ({totalTransactions})
        </h3>
        <div className="flex items-center">
          <div className="w-px h-6 bg-gray-400 mx-4"></div>
          <span className="mr-2.5 text-brand-primary-dark dark:text-white">
            Total Cases: <strong>{totalTransactions}</strong>
          </span>
        </div>
      </div>

      {/* Filter Panel */}
      <ComplianceFilterPanel
        className="mb-4"
        statusOptions={[
          { value: EComplianceTransactionStatus.UNREVIEWED, label: 'Unreviewed' },
          { value: EComplianceTransactionStatus.IN_REVIEW, label: 'In Review' },
          { value: EComplianceTransactionStatus.HOLD, label: 'Hold' }
        ]}
        availableBlockchains={availableBlockchains}
        showTransactionIdFilter={true}
        defaultStatus={ACTIVE_STATUSES}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        applyOnChange={true}
      />

      <ErrorBoundary>
        <ActiveCasesTable
          transactions={validatedTransactions}
          totalTransactions={totalTransactions}
          currentPage={currentPage}
          pageSize={pageSize}
          loading={loading}
          onTableChange={handleTableChange}
          isActiveCasesTab={true}
        />
      </ErrorBoundary>
    </div>
  );
};

export default ActiveCasesTab;