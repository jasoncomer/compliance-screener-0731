import { configureStore } from '@reduxjs/toolkit';
import sotReducer from './slices/sotSlice';
import organizationReducer from './slices/organizationSlice';

export const store = configureStore({
  reducer: {
    sot: sotReducer,
    organization: organizationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 