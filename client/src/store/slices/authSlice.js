import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getMe, logout, loginWithEmailAndPassword, registerWithEmailAndPassword } from '../../services/auth.service.js';

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const data = await getMe();
    return data; 
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

export const loginUser = createAsyncThunk('auth/loginUser', async ({ email, password }, { rejectWithValue }) => {
  try {
    const data = await loginWithEmailAndPassword(email, password);
    return data;
  } catch (error) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Login failed';
    return rejectWithValue(message);
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async ({ email, password, name }, { rejectWithValue }) => {
  try {
    const data = await registerWithEmailAndPassword(email, password, name);
    return data;
  } catch (error) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed';
    return rejectWithValue(message);
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
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.authLoading = false;
        state.me = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authLoading = false;
        state.error = action.payload;
      })
      // registerUser
      .addCase(registerUser.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.authLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.authLoading = false;
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
