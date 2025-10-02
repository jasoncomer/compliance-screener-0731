import { configureStore } from '@reduxjs/toolkit';

import complianceTransactionsReducer from './slices/complianceTransactionsSlice';
import monitoredAddressesReducer from './slices/monitoredAddressesSlice';
import organizationsReducer from './slices/organizationsSlice';
import sotReducer from './slices/sotSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import casesReducer from './slices/casesSlice';
import clientOverviewReducer from './slices/clientOverviewSlice';

export const store = configureStore({
  reducer: {
    sot: sotReducer,
    complianceTransactions: complianceTransactionsReducer,
    monitoredAddresses: monitoredAddressesReducer,
    organizations: organizationsReducer,
    subscription: subscriptionReducer,
    cases: casesReducer,
    clientOverview: clientOverviewReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
