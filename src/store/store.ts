import { configureStore } from '@reduxjs/toolkit';
import sotReducer from './slices/sotSlice';

export const store = configureStore({
  reducer: {
    sot: sotReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 