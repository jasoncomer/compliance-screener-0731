import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { api } from '../../api/api';
import { ISubscriptionTier, IOrganizationSubscription } from '../../typings/subscription';

interface SubscriptionState {
  tiers: ISubscriptionTier[];
  currentSubscription: IOrganizationSubscription | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  tiers: [],
  currentSubscription: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchSubscriptionTiers = createAsyncThunk(
  'subscription/fetchTiers',
  async (_, { rejectWithValue }) => {
    try {
      return await api.subscription.getSubscriptionTiers();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch subscription tiers');
    }
  }
);

export const fetchOrganizationSubscription = createAsyncThunk(
  'subscription/fetchOrganizationSubscription',
  async (organizationId: string, { rejectWithValue }) => {
    try {
      return await api.subscription.getOrganizationSubscription(organizationId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization subscription');
    }
  }
);

export const createOrganizationSubscription = createAsyncThunk(
  'subscription/createOrganizationSubscription',
  async ({ organizationId, tierId, billingPeriod }: { organizationId: string; tierId: string; billingPeriod: 'monthly' | 'yearly' }, { rejectWithValue }) => {
    try {
      return await api.subscription.createOrganizationSubscription(organizationId, tierId, billingPeriod);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subscription');
    }
  }
);

export const updateOrganizationSubscription = createAsyncThunk(
  'subscription/updateOrganizationSubscription',
  async ({ organizationId, tierId, billingPeriod }: { organizationId: string; tierId: string; billingPeriod: 'monthly' | 'yearly' }, { rejectWithValue }) => {
    try {
      return await api.subscription.updateOrganizationSubscription(organizationId, tierId, billingPeriod);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update subscription');
    }
  }
);

export const cancelOrganizationSubscription = createAsyncThunk(
  'subscription/cancelOrganizationSubscription',
  async (
    { organizationId, cancelImmediately = false }: { organizationId: string; cancelImmediately?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const result = await api.subscription.cancelOrganizationSubscription(organizationId, cancelImmediately);
      return result.subscription;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel subscription');
    }
  }
);

// Slice
const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    clearSubscriptionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tiers
      .addCase(fetchSubscriptionTiers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionTiers.fulfilled, (state, action: PayloadAction<ISubscriptionTier[]>) => {
        state.loading = false;
        state.tiers = action.payload;
      })
      .addCase(fetchSubscriptionTiers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch organization subscription
      .addCase(fetchOrganizationSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationSubscription.fulfilled, (state, action: PayloadAction<IOrganizationSubscription>) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(fetchOrganizationSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create subscription
      .addCase(createOrganizationSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrganizationSubscription.fulfilled, (state, action: PayloadAction<IOrganizationSubscription>) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(createOrganizationSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update subscription
      .addCase(updateOrganizationSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrganizationSubscription.fulfilled, (state, action: PayloadAction<IOrganizationSubscription>) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(updateOrganizationSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Cancel subscription
      .addCase(cancelOrganizationSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrganizationSubscription.fulfilled, (state, action: PayloadAction<IOrganizationSubscription>) => {
        state.loading = false;
        state.currentSubscription = action.payload;
      })
      .addCase(cancelOrganizationSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Actions
export const { clearSubscriptionError } = subscriptionSlice.actions;

// Selectors
export const selectSubscriptionTiers = (state: RootState) => state.subscription.tiers;
export const selectCurrentSubscription = (state: RootState) => state.subscription.currentSubscription;
export const selectSubscriptionLoading = (state: RootState) => state.subscription.loading;
export const selectSubscriptionError = (state: RootState) => state.subscription.error;

export default subscriptionSlice.reducer; 