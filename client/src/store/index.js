import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import repoReducer from './slices/repoSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    repos: repoReducer,
  },
});
