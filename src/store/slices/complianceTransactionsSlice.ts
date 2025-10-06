import { createAsyncThunk, createSelector,createSlice, PayloadAction } from '@reduxjs/toolkit';

import { api } from '../../api/api';
import { ComplianceTransactionResponse, EComplianceTransactionStatus,IComplianceTransaction, TransactionFilters } from '../../typings/compliance';
import { RootState } from '../store';

interface ComplianceTransactionsState {
  transactions: {
    [id: string]: IComplianceTransaction;
  };
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  total: number;
  page: number;
  limit: number;
}

const initialState: ComplianceTransactionsState = {
  transactions: {},
  loading: false,
  error: null,
  filters: {},
  total: 0,
  page: 1,
  limit: 10,
};

export const fetchComplianceTransactions = createAsyncThunk(
  'complianceTransactions/fetchTransactions',
  async (filters: TransactionFilters) => {
    const response = await api.compliance.getTransactions(filters);
    return response;
  }
);

export const updateTransactionStatus = createAsyncThunk(
  'complianceTransactions/updateStatus',
  async ({ transactionId, status }: { transactionId: string; status: string }) => {
    const response = await api.compliance.updateTransactionStatus(transactionId, status);
    return response;
  }
);

export const updateTransactionAssignee = createAsyncThunk(
  'complianceTransactions/updateAssignee',
  async ({ transactionId, assignee }: { transactionId: string; assignee: string }) => {
    const response = await api.compliance.updateTransactionAssignee(transactionId, assignee);
    return response;
  }
);

export const bulkUpdateTransactionAssignee = createAsyncThunk(
  'complianceTransactions/bulkUpdateAssignee',
  async ({ transactionIds, assignee }: { transactionIds: string[]; assignee: string }) => {
    const response = await api.compliance.bulkUpdateTransactionAssignee(transactionIds, assignee);
    return response;
  }
);

export const bulkUpdateTransactionStatus = createAsyncThunk(
  'complianceTransactions/bulkUpdateStatus',
  async ({ transactionIds, status }: { transactionIds: string[]; status: string }) => {
    const response = await api.compliance.bulkUpdateTransactionStatus(transactionIds, status);
    return response;
  }
);

const complianceTransactionsSlice = createSlice({
  name: 'complianceTransactions',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TransactionFilters>) => {
      state.filters = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplianceTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplianceTransactions.fulfilled, (state, action) => {
        state.loading = false;
        
        const response = action.payload as ComplianceTransactionResponse;
        
        console.log('🔍 Redux - fetchComplianceTransactions.fulfilled:', {
          responseType: typeof response,
          hasTransactions: Array.isArray(response?.transactions),
          transactionCount: response?.transactions?.length || 0,
          total: response?.total,
          page: response?.page,
          limit: response?.limit,
          firstTransactionStatus: response?.transactions?.[0]?.status,
          allStatuses: response?.transactions?.map(tx => tx.status) || [],
          firstTransactionId: response?.transactions?.[0]?._id,
          firstTransactionTxId: response?.transactions?.[0]?.txId
        });
        
        // Validate response structure
        if (!response || !Array.isArray(response.transactions)) {
          console.error('Invalid API response structure:', response);
          state.error = 'Invalid response structure from API';
          return;
        }
        
        const transactionsById: Record<string, IComplianceTransaction> = {};
        
        // Validate and filter transactions
        response.transactions.forEach((transaction) => {
          if (transaction && transaction._id && typeof transaction._id === 'string') {
            // Ensure all required fields are present
            const validatedTransaction: IComplianceTransaction = {
              _id: transaction._id,
              txId: transaction.txId || '',
              clientId: transaction.clientId || '',
              monitoredAddressId: transaction.monitoredAddressId || '',
              counterpartyEntities: Array.isArray(transaction.counterpartyEntities) ? transaction.counterpartyEntities : [],
              blockchain: transaction.blockchain || '',
              amount: typeof transaction.amount === 'number' ? transaction.amount : 0,
              timestamp: transaction.timestamp || new Date(),
              riskScores: Array.isArray(transaction.riskScores) ? transaction.riskScores : [],
              organizationId: transaction.organizationId || '',
              notes: transaction.notes,
              sarSubmitted: Boolean(transaction.sarSubmitted),
              sarReport: transaction.sarReport,
              reviewerId: transaction.reviewerId,
              reviewTimestamp: transaction.reviewTimestamp,
              status: transaction.status || EComplianceTransactionStatus.UNASSIGNED,
              statusHistory: Array.isArray(transaction.statusHistory) ? transaction.statusHistory : [],
              approvedBy: transaction.approvedBy,
              approvedAt: transaction.approvedAt,
            };
            
            transactionsById[transaction._id] = validatedTransaction;
          } else {
            console.warn('Skipping invalid transaction:', transaction);
          }
        });
        
        state.transactions = transactionsById;
        state.total = typeof response.total === 'number' ? response.total : 0;
        state.page = typeof response.page === 'number' ? response.page : 1;
        state.limit = typeof response.limit === 'number' ? response.limit : 10;
      })
      .addCase(fetchComplianceTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch compliance transactions';
      })
      .addCase(updateTransactionAssignee.fulfilled, (state, action) => {
        const updatedTransaction = action.payload as IComplianceTransaction;
        if (updatedTransaction && updatedTransaction._id) {
          state.transactions[updatedTransaction._id] = updatedTransaction;
        }
      })
      .addCase(updateTransactionStatus.fulfilled, (state, action) => {
        const updatedTransaction = action.payload as IComplianceTransaction;
        if (updatedTransaction && updatedTransaction._id) {
          state.transactions[updatedTransaction._id] = updatedTransaction;
        }
      })
      .addCase(bulkUpdateTransactionAssignee.fulfilled, (state, action) => {
        const updatedTransactions = action.payload as IComplianceTransaction[];
        updatedTransactions.forEach(transaction => {
          if (transaction && transaction._id) {
            state.transactions[transaction._id] = transaction;
          }
        });
      })
      .addCase(bulkUpdateTransactionStatus.fulfilled, (state, action) => {
        const updatedTransactions = action.payload as IComplianceTransaction[];
        updatedTransactions.forEach(transaction => {
          if (transaction && transaction._id) {
            state.transactions[transaction._id] = transaction;
          }
        });
      });
  },
});

// Selectors
export const selectAllTransactions = createSelector(
  (state: RootState) => state.complianceTransactions.transactions,
  (txs: Record<string, IComplianceTransaction>) => Object.values(txs)
);

export const selectUnassignedTransactions = createSelector(
  (state: RootState) => state.complianceTransactions.transactions,
  (txs: Record<string, IComplianceTransaction>) => Object.values(txs).filter((tx) => 
    tx.status === EComplianceTransactionStatus.UNASSIGNED
  )
);

export const selectCompletedTransactions = createSelector(
  (state: RootState) => state.complianceTransactions.transactions,
  (txs: Record<string, IComplianceTransaction>) => Object.values(txs).filter((tx) => 
    tx.status === EComplianceTransactionStatus.APPROVED || 
    tx.status === EComplianceTransactionStatus.CLOSED_WITH_NOTE || 
    tx.status === EComplianceTransactionStatus.CLOSED_WITH_SAR
  )
);

export const selectActiveTransactions = createSelector(
  (state: RootState) => state.complianceTransactions.transactions,
  (state: RootState) => state.complianceTransactions.filters,
  (txs: Record<string, IComplianceTransaction>, filters: TransactionFilters) => {
    const allTransactions = Object.values(txs);
    
    console.log('🔍 Redux Selector - selectActiveTransactions:', {
      totalTransactions: allTransactions.length,
      filters,
      transactionIds: allTransactions.map(tx => tx._id),
      statuses: allTransactions.map(tx => tx.status)
    });
    
    // If we have server-side filtering (indicated by non-status filters), 
    // the server should have already filtered by status, but we still need to ensure
    // we only return active transactions for the Case Management tab
    const hasServerSideFilters = filters.blockchain || filters.assignedTo || 
                                filters.timestamp || filters.minAmount || 
                                filters.maxAmount || filters.riskLevel;
    
    console.log('🔍 Redux Selector - hasServerSideFilters:', hasServerSideFilters);
    
    if (hasServerSideFilters) {
      // Even with server-side filtering, ensure we only return active statuses
      const defaultActiveStatuses = [
        EComplianceTransactionStatus.UNREVIEWED,
        EComplianceTransactionStatus.IN_REVIEW,
        EComplianceTransactionStatus.HOLD
      ];
      const filtered = allTransactions.filter(tx => defaultActiveStatuses.includes(tx.status));
      console.log('🔍 Redux Selector - Final result (server-side filters):', {
        filteredCount: filtered.length,
        statuses: filtered.map(tx => tx.status),
        riskScores: filtered.map(tx => tx.riskScores)
      });
      return filtered;
    }
    
    // Apply client-side filtering for fields that need partial matching
    let filteredTransactions = allTransactions;
    
    // Filter by txId (partial match)
    if (filters.txId) {
      console.log('Client-side filtering by txId:', {
        searchTerm: filters.txId,
        totalTransactions: filteredTransactions.length,
        sampleTxIds: filteredTransactions.slice(0, 3).map(tx => tx.txId),
        beforeFilter: filteredTransactions.length
      });
      
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.txId && tx.txId.toLowerCase().includes(filters.txId!.toLowerCase())
      );
      
      console.log('After txId filtering:', {
        afterFilter: filteredTransactions.length,
        filteredTxIds: filteredTransactions.map(tx => tx.txId)
      });
    }
    
    // Filter by clientId (partial match)
    if (filters.clientId) {
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.clientId && tx.clientId.toLowerCase().includes(filters.clientId!.toLowerCase())
      );
    }
    
    // If no status filter is set, use default active statuses
    if (!filters.status) {
      const defaultActiveStatuses = [
        EComplianceTransactionStatus.UNREVIEWED,
        EComplianceTransactionStatus.IN_REVIEW,
        EComplianceTransactionStatus.HOLD
      ];
      return filteredTransactions.filter(tx => defaultActiveStatuses.includes(tx.status));
    }
    
    // If status filter is set, respect it
    const allowedStatuses = filters.status.split(',').map(s => s.trim());
    const finalResult = filteredTransactions.filter(tx => allowedStatuses.includes(tx.status));
    console.log('🔍 Redux Selector - Final result (with status filter):', {
      allowedStatuses,
      filteredCount: finalResult.length,
      statuses: finalResult.map(tx => tx.status),
      riskScores: finalResult.map(tx => tx.riskScores)
    });
    return finalResult;
  }
);

export const selectTransactionById = createSelector(
  (state: RootState) => state.complianceTransactions.transactions,
  (_: RootState, id: string) => id,
  (txs: Record<string, IComplianceTransaction>, id: string) => txs[id]
);

export const selectComplianceFilters = (state: RootState) => state.complianceTransactions.filters;

export const selectPagination = createSelector(
  (state: RootState) => state.complianceTransactions,
  (complianceTransactions) => ({
    total: complianceTransactions.total,
    page: complianceTransactions.page,
    limit: complianceTransactions.limit,
  })
);

export const selectIsLoading = (state: RootState) =>
  state.complianceTransactions.loading;

export const { setFilters, setPage, setLimit } = complianceTransactionsSlice.actions;
export default complianceTransactionsSlice.reducer;