import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/api';
import { SOT } from '../../typings/interfaces';

interface SOTState {
  items: SOT[];
  itemsMap: Record<string, SOT>;
  loading: boolean;
  error: string | null;
}

const initialState: SOTState = {
  items: [],
  itemsMap: {},
  loading: false,
  error: null,
};

export const fetchSOT = createAsyncThunk(
  'sot/fetchSOT',
  async () => {
    const response = await api.sot.getSOT();
    return response;
  }
);

const sotSlice = createSlice({
  name: 'sot',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSOT.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSOT.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // Index by entity_id for proper lookup in Risk Dashboard
        state.itemsMap = action.payload.reduce((acc, item) => {
          acc[item.entity_id] = item;
          return acc;
        }, {} as Record<string, SOT>);
        

      })
      .addCase(fetchSOT.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch SOT data';
      });
  },
});

// Selectors
export const selectSotItemsMap = (state: { sot: SOTState }) => state.sot.itemsMap;
export const selectSotItems = (state: { sot: SOTState }) => state.sot.items;
export const selectSotLoading = (state: { sot: SOTState }) => state.sot.loading;
export const selectSotError = (state: { sot: SOTState }) => state.sot.error;

export default sotSlice.reducer;