import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { caseApi } from '../../api/case';
import { ClientOverview, ICase } from '../../typings/case';
import { IComplianceTransaction } from '../../typings/compliance';

interface ClientOverviewState {
  overview: ClientOverview | null;
  cases: ICase[];
  transactions: IComplianceTransaction[];
  topCounterparties: Array<{
    entityId: string;
    count: number;
    totalAmount: number;
    lastTransactionDate: string;
  }>;
  loading: boolean;
  error: string | null;
  currentClientId: string | null;
}

const initialState: ClientOverviewState = {
  overview: null,
  cases: [],
  transactions: [],
  topCounterparties: [],
  loading: false,
  error: null,
  currentClientId: null
};

// Async thunks
export const fetchClientOverview = createAsyncThunk(
  'clientOverview/fetchClientOverview',
  async ({ clientId, timeRange, refresh }: { clientId: string; timeRange?: string; refresh?: boolean }) => {
    const response = await caseApi.getClientOverview(clientId, timeRange, refresh);
    return { ...response, clientId };
  }
);

const clientOverviewSlice = createSlice({
  name: 'clientOverview',
  initialState,
  reducers: {
    clearClientOverview: (state) => {
      state.overview = null;
      state.cases = [];
      state.transactions = [];
      state.topCounterparties = [];
      state.currentClientId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentClientId: (state, action: PayloadAction<string | null>) => {
      state.currentClientId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload.overview;
        state.cases = action.payload.cases;
        state.transactions = action.payload.transactions || [];
        state.topCounterparties = action.payload.topCounterparties || [];
        state.currentClientId = action.payload.clientId;
      })
      .addCase(fetchClientOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch client overview';
      });
  }
});

export const {
  clearClientOverview,
  clearError,
  setCurrentClientId
} = clientOverviewSlice.actions;

// Selectors
export const selectClientOverview = (state: { clientOverview: ClientOverviewState }) => state.clientOverview.overview;
export const selectClientCases = (state: { clientOverview: ClientOverviewState }) => state.clientOverview.cases;
export const selectClientTransactions = (state: { clientOverview: ClientOverviewState }) => state.clientOverview.transactions;
export const selectTopCounterparties = (state: { clientOverview: ClientOverviewState }) => state.clientOverview.topCounterparties;
export const selectClientOverviewLoading = (state: { clientOverview: ClientOverviewState }) => state.clientOverview.loading;
export const selectClientOverviewError = (state: { clientOverview: ClientOverviewState }) => state.clientOverview.error;
export const selectCurrentClientId = (state: { clientOverview: ClientOverviewState }) => state.clientOverview.currentClientId;

export default clientOverviewSlice.reducer;