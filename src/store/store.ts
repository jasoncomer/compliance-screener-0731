import { configureStore } from '@reduxjs/toolkit';
import sotReducer from './slices/sotSlice';
import complianceTransactionsReducer from './slices/complianceTransactionsSlice';
import monitoredAddressesReducer from './slices/monitoredAddressesSlice';
import organizationsReducer from './slices/organizationsSlice';

export const store = configureStore({
  reducer: {
    sot: sotReducer,
    complianceTransactions: complianceTransactionsReducer,
    monitoredAddresses: monitoredAddressesReducer,
    organizations: organizationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;