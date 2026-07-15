import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getStoreRepos, createStoreRepo } from '../../services/store.service.js';
import toast from '../../utils/Toast.js';

export const fetchStores = createAsyncThunk('store/fetchStores', async (_, { rejectWithValue }) => {
  try {
    const data = await getStoreRepos();
    return data.store?.result || [];
  } catch (error) {
    return rejectWithValue(error.message || 'Failed to fetch stores');
  }
});

export const createStore = createAsyncThunk(
  'store/createStore',
  async (storeName, { dispatch, rejectWithValue }) => {
    try {
      const data = await createStoreRepo(storeName);
      toast.success(`Store "${storeName}" and GitHub repository created successfully!`);
      dispatch(fetchStores());
      return data.store?.dbResult;
    } catch (error) {
      toast.error(error.message || 'Failed to create store repository');
      return rejectWithValue(error.message || 'Failed to create store');
    }
  }
);

const initialState = {
  stores: [],
  loading: false,
  creating: false,
  error: null,
};

const storeSlice = createSlice({
  name: 'store',
  initialState,
  reducers: {
    clearStoreState: (state) => {
      state.stores = [];
      state.error = null;
      state.loading = false;
      state.creating = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Stores
      .addCase(fetchStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Store
      .addCase(createStore.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createStore.fulfilled, (state) => {
        state.creating = false;
      })
      .addCase(createStore.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });
  },
});

export const { clearStoreState } = storeSlice.actions;
export default storeSlice.reducer;
