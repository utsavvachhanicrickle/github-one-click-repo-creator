import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getMe,
  logout,
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  registerPersonalUser,
  getAdminPersonalUserRelations
} from '../../services/auth.service.js';

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

export const fetchAdminRelations = createAsyncThunk('auth/fetchAdminRelations', async (_, { rejectWithValue }) => {
  try {
    const data = await getAdminPersonalUserRelations();
    return data.relations;
  } catch (error) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to fetch relations';
    return rejectWithValue(message);
  }
});

export const createPersonalUser = createAsyncThunk('auth/createPersonalUser', async ({ email, password, name }, { rejectWithValue }) => {
  try {
    const data = await registerPersonalUser(email, password, name);
    return data.relations;
  } catch (error) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create personal user';
    return rejectWithValue(message);
  }
});

const initialState = {
  me: null,
  authLoading: true,
  error: null,
  relations: [],
  relationsLoading: false,
  relationsError: null,
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
        state.relations = [];
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
      })
      // fetchAdminRelations
      .addCase(fetchAdminRelations.pending, (state) => {
        state.relationsLoading = true;
        state.relationsError = null;
      })
      .addCase(fetchAdminRelations.fulfilled, (state, action) => {
        state.relationsLoading = false;
        state.relations = action.payload || [];
      })
      .addCase(fetchAdminRelations.rejected, (state, action) => {
        state.relationsLoading = false;
        state.relationsError = action.payload;
      })
      // createPersonalUser
      .addCase(createPersonalUser.pending, (state) => {
        state.relationsLoading = true;
        state.relationsError = null;
      })
      .addCase(createPersonalUser.fulfilled, (state, action) => {
        state.relationsLoading = false;
        state.relations.push(action.payload);
      })
      .addCase(createPersonalUser.rejected, (state, action) => {
        state.relationsLoading = false;
        state.relationsError = action.payload;
      });
  },
});

export const { setAuthData } = authSlice.actions;
export default authSlice.reducer;
