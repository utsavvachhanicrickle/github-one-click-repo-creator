import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMe, logout } from '../../services/api.js';

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const data = await getMe();
    return data; // returns { authenticated: boolean, user: object }
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    await logout();
    return null;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const initialState = {
  me: null,
  authLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthData: (state, action) => {
      state.me = action.payload;
      state.authLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchMe
      .addCase(fetchMe.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.authLoading = false;
        state.me = action.payload.authenticated ? action.payload.user : null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.authLoading = false;
        state.me = null;
        state.error = action.payload;
      })
      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.me = null;
        state.authLoading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setAuthData } = authSlice.actions;
export default authSlice.reducer;
