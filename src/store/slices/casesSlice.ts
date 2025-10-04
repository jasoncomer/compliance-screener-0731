import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { caseApi } from '../../api/case';
import { ICase, CaseFilters, CreateCaseRequest, UpdateCaseStatusRequest, ECaseStatus } from '../../typings/case';

interface CasesState {
  cases: ICase[];
  currentCase: ICase | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: CaseFilters;
}

const initialState: CasesState = {
  cases: [],
  currentCase: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  filters: {}
};

// Async thunks
export const fetchCases = createAsyncThunk(
  'cases/fetchCases',
  async (filters: CaseFilters = {}) => {
    const response = await caseApi.getCases(filters);
    return response;
  }
);

export const fetchCaseById = createAsyncThunk(
  'cases/fetchCaseById',
  async (caseId: string) => {
    const response = await caseApi.getCaseById(caseId);
    return response;
  }
);

export const createCaseFromTransaction = createAsyncThunk(
  'cases/createCaseFromTransaction',
  async ({ transactionId, caseData }: { transactionId: string; caseData: CreateCaseRequest }) => {
    const response = await caseApi.createCaseFromTransaction(transactionId, caseData);
    return response;
  }
);

export const updateCaseStatus = createAsyncThunk(
  'cases/updateCaseStatus',
  async ({ caseId, statusData }: { caseId: string; statusData: UpdateCaseStatusRequest }) => {
    const response = await caseApi.updateCaseStatus(caseId, statusData);
    return response;
  }
);

export const reassignCase = createAsyncThunk(
  'cases/reassignCase',
  async ({ caseId, assignedTo, notes }: { caseId: string; assignedTo: string; notes?: string }) => {
    const response = await caseApi.reassignCase(caseId, assignedTo, notes);
    return response;
  }
);

const casesSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<CaseFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setCurrentCase: (state, action: PayloadAction<ICase | null>) => {
      state.currentCase = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateCaseInList: (state, action: PayloadAction<ICase>) => {
      const index = state.cases.findIndex(caseItem => caseItem._id === action.payload._id);
      if (index !== -1) {
        state.cases[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cases
      .addCase(fetchCases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.loading = false;
        state.cases = action.payload.cases;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cases';
      })
      
      // Fetch case by ID
      .addCase(fetchCaseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCaseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCase = action.payload;
      })
      .addCase(fetchCaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch case';
      })
      
      // Create case from transaction
      .addCase(createCaseFromTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCaseFromTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.cases.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createCaseFromTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create case';
      })
      
      // Update case status
      .addCase(updateCaseStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCaseStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCase = action.payload;
        
          // Update in cases list
          const index = state.cases.findIndex(caseItem => caseItem._id === updatedCase._id);
        if (index !== -1) {
          state.cases[index] = updatedCase;
        }
        
        // Update current case if it's the same
        if (state.currentCase && state.currentCase._id === updatedCase._id) {
          state.currentCase = updatedCase;
        }
      })
      .addCase(updateCaseStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update case status';
      })
      
      // Reassign case
      .addCase(reassignCase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reassignCase.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCase = action.payload;
        
        // Update in cases list
        const index = state.cases.findIndex(caseItem => caseItem._id === updatedCase._id);
        if (index !== -1) {
          state.cases[index] = updatedCase;
        }
        
        // Update current case if it's the same
        if (state.currentCase && state.currentCase._id === updatedCase._id) {
          state.currentCase = updatedCase;
        }
      })
      .addCase(reassignCase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reassign case';
      });
  }
});

export const {
  setFilters,
  clearFilters,
  setCurrentCase,
  clearError,
  updateCaseInList
} = casesSlice.actions;

// Selectors
export const selectAllCases = (state: { cases: CasesState }) => state.cases.cases;
export const selectCurrentCase = (state: { cases: CasesState }) => state.cases.currentCase;
export const selectCasesLoading = (state: { cases: CasesState }) => state.cases.loading;
export const selectCasesError = (state: { cases: CasesState }) => state.cases.error;
export const selectCasesPagination = (state: { cases: CasesState }) => ({
  total: state.cases.total,
  page: state.cases.page,
  limit: state.cases.limit,
  totalPages: state.cases.totalPages
});
export const selectCasesFilters = (state: { cases: CasesState }) => state.cases.filters;

// Filtered cases selectors
export const selectOpenCases = (state: { cases: CasesState }) => 
  state.cases.cases.filter(caseItem => caseItem.status === ECaseStatus.OPEN || caseItem.status === ECaseStatus.IN_PROGRESS);

export const selectClosedCases = (state: { cases: CasesState }) => 
  state.cases.cases.filter(caseItem => caseItem.status === ECaseStatus.CLOSED || caseItem.status === ECaseStatus.ARCHIVED);

export const selectUnreviewedCases = (state: { cases: CasesState }) => 
  state.cases.cases.filter(caseItem => caseItem.status === ECaseStatus.UNREVIEWED);

export const selectHighPriorityCases = (state: { cases: CasesState }) => 
  state.cases.cases.filter(caseItem => caseItem.priority === 'HIGH' || caseItem.priority === 'CRITICAL');

export default casesSlice.reducer;