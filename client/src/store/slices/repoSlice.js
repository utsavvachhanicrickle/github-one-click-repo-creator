import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserRepositories, createWebsiteRepo, getForkFamilies } from '../../services/github.service.js';
import { showToast } from './toastSlice.js';

export const fetchGitHubRepos = createAsyncThunk('repos/fetchGitHubRepos', async (_, { rejectWithValue }) => {
  try {
    const repos = await getUserRepositories();
    return repos;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const fetchForkFamilies = createAsyncThunk('repos/fetchForkFamilies', async (_, { rejectWithValue }) => {
  try {
    const families = await getForkFamilies();
    return families;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

export const createRepo = createAsyncThunk(
  'repos/createRepo',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const data = await createWebsiteRepo(payload);
      // Dispatch success toast
      dispatch(showToast({ message: `Repository "${payload.repoName}" created successfully!`, type: 'success' }));
      // Refresh lists
      dispatch(fetchGitHubRepos());
      dispatch(fetchForkFamilies());
      return data.repo;
    } catch (error) {
      dispatch(showToast({ message: error.message || 'Failed to create repository', type: 'error' }));
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  allGitHubRepos: [],
  forkFamilies: [],
  gitHubLoading: false,
  creating: false,
  createdRepo: null,
  error: null,
};

const repoSlice = createSlice({
  name: 'repos',
  initialState,
  reducers: {
    clearCreatedRepo: (state) => {
      state.createdRepo = null;
    },
    clearRepoError: (state) => {
      state.error = null;
    },
    clearRepoState: (state) => {
      state.allGitHubRepos = [];
      state.createdRepo = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchGitHubRepos
      .addCase(fetchGitHubRepos.pending, (state) => {
        state.gitHubLoading = true;
      })
      .addCase(fetchGitHubRepos.fulfilled, (state, action) => {
        state.gitHubLoading = false;
        state.allGitHubRepos = action.payload;
      })
      .addCase(fetchGitHubRepos.rejected, (state) => {
        state.gitHubLoading = false;
      })
      // fetchForkFamilies
      .addCase(fetchForkFamilies.fulfilled, (state, action) => {
        state.forkFamilies = action.payload || [];
      })
      // createRepo
      .addCase(createRepo.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.createdRepo = null;
      })
      .addCase(createRepo.fulfilled, (state, action) => {
        state.creating = false;
        state.createdRepo = action.payload;
      })
      .addCase(createRepo.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });
  },
});

export const { clearCreatedRepo, clearRepoError, clearRepoState } = repoSlice.actions;
export default repoSlice.reducer;
