import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import { api } from '../../api/api';
import { 
  AddressUploadFormat,
  AddressUploadResponse, 
  IAddressFilters, 
  MonitoredAddress, 
  MonitoredAddressChange} from '../../typings/compliance';
import { RootState } from '../store';

interface MonitoredAddressesState {
  addresses: {
    [id: string]: MonitoredAddress;
  };
  addressHistory: {
    [addressId: string]: MonitoredAddressChange[];
  };
  loading: boolean;
  error: string | null;
  filters: IAddressFilters;
  uploadResponse: AddressUploadResponse | null;
}

const initialState: MonitoredAddressesState = {
  addresses: {},
  addressHistory: {},
  loading: false,
  error: null,
  filters: {},
  uploadResponse: null,
};

export const fetchMonitoredAddresses = createAsyncThunk(
  'monitoredAddresses/fetchAddresses',
  async () => {
    const response = await api.compliance.getAddresses();
    return response;
  }
);

export const fetchFilteredAddresses = createAsyncThunk(
  'monitoredAddresses/fetchFilteredAddresses',
  async (filters: IAddressFilters) => {
    const response = await api.compliance.getFilteredAddresses(filters);
    return response;
  }
);

export const fetchAddressHistory = createAsyncThunk(
  'monitoredAddresses/fetchAddressHistory',
  async (addressId: string) => {
    const response = await api.compliance.getAddressChangeHistory(addressId);
    return { addressId, history: response };
  }
);

export const addMonitoredAddress = createAsyncThunk(
  'monitoredAddresses/addAddress',
  async ({ address, organizationId }: { 
    address: Omit<MonitoredAddress, 'id' | 'createdAt' | 'updatedAt' | 'lastModifiedAt' | 'lastModifiedBy'>, 
    organizationId?: string 
  }) => {
    const response = await api.compliance.addAddress(address, organizationId);
    return response;
  }
);

export const updateMonitoredAddress = createAsyncThunk(
  'monitoredAddresses/updateAddress',
  async ({ id, statusChangeReason, updateData }: { 
    id: string, 
    statusChangeReason: string, 
    updateData: Partial<MonitoredAddress> 
  }) => {
    const response = await api.compliance.updateAddress(id, statusChangeReason, updateData);
    return response;
  }
);

export const deleteMonitoredAddress = createAsyncThunk(
  'monitoredAddresses/deleteAddress',
  async (id: string) => {
    await api.compliance.deleteAddress(id);
    return id;
  }
);

export const bulkUploadAddresses = createAsyncThunk(
  'monitoredAddresses/bulkUpload',
  async (addresses: AddressUploadFormat[]) => {
    const response = await api.compliance.bulkUpload(addresses);
    return response;
  }
);

const monitoredAddressesSlice = createSlice({
  name: 'monitoredAddresses',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<IAddressFilters>) => {
      state.filters = action.payload;
    },
    clearUploadResponse: (state) => {
      state.uploadResponse = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all addresses
      .addCase(fetchMonitoredAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonitoredAddresses.fulfilled, (state, action) => {
        state.loading = false;
        
        const addressesById: Record<string, MonitoredAddress> = {};
        action.payload.forEach((address: MonitoredAddress) => {
          addressesById[address._id] = address;
        });
        
        state.addresses = addressesById;
      })
      .addCase(fetchMonitoredAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch monitored addresses';
      })
      
      // Fetch filtered addresses
      .addCase(fetchFilteredAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilteredAddresses.fulfilled, (state, action) => {
        state.loading = false;
        
        const addressesById: Record<string, MonitoredAddress> = {};
        action.payload.forEach((address: MonitoredAddress) => {
          addressesById[address._id] = address;
        });
        
        state.addresses = addressesById;
      })
      .addCase(fetchFilteredAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch filtered addresses';
      })
      
      // Fetch address history
      .addCase(fetchAddressHistory.fulfilled, (state, action) => {
        const { addressId, history } = action.payload;
        state.addressHistory[addressId] = history;
      })
      
      // Add a new address
      .addCase(addMonitoredAddress.fulfilled, (state, action) => {
        const newAddress = action.payload;
        state.addresses[newAddress._id] = newAddress;
      })
      
      // Update an address
      .addCase(updateMonitoredAddress.fulfilled, (state, action) => {
        const updatedAddress = action.payload;
        state.addresses[updatedAddress._id] = updatedAddress;
      })
      
      // Delete an address
      .addCase(deleteMonitoredAddress.fulfilled, (state, action) => {
        const addressId = action.payload;
        delete state.addresses[addressId];
        if (state.addressHistory[addressId]) {
          delete state.addressHistory[addressId];
        }
      })
      
      // Bulk upload addresses
      .addCase(bulkUploadAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadResponse = null;
      })
      .addCase(bulkUploadAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadResponse = action.payload;
        
        // Add successfully uploaded addresses to the state
        action.payload.successful.forEach((address) => {
          if ('_id' in address) {
            state.addresses[address._id as string] = address as MonitoredAddress;
          }
        });
      })
      .addCase(bulkUploadAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to bulk upload addresses';
      });
  },
});

// Selectors
export const selectAllAddresses = createSelector(
  (state: RootState) => state.monitoredAddresses.addresses,
  (addresses) => Object.values(addresses)
);

export const selectAddressById = (state: RootState, id: string) =>
  state.monitoredAddresses.addresses[id];

export const selectAddressHistory = createSelector(
  (state: RootState) => state.monitoredAddresses.addressHistory,
  (_: any, addressId: string) => addressId,
  (addressHistory, addressId) => addressHistory[addressId] || []
);

export const selectFilters = (state: RootState) => state.monitoredAddresses.filters;

export const selectIsLoading = (state: RootState) =>
  state.monitoredAddresses.loading;

export const selectUploadResponse = (state: RootState) => state.monitoredAddresses.uploadResponse;

export const { setFilters, clearUploadResponse } = monitoredAddressesSlice.actions;
export default monitoredAddressesSlice.reducer;