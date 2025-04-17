import { configureStore } from '@reduxjs/toolkit';
import sotReducer from './slices/sotSlice';
import organizationsReducer from './slices/organizationsSlice';
import complianceTransactionsReducer from './slices/complianceTransactionsSlice';
import monitoredAddressesReducer from './slices/monitoredAddressesSlice';
import organizationReducer from './slices/organizationSlice';

export const store = configureStore({
  reducer: {
    sot: sotReducer,
    organizations: organizationsReducer,
    complianceTransactions: complianceTransactionsReducer,
    monitoredAddresses: monitoredAddressesReducer,
    organization: organizationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;