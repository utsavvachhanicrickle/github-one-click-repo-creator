import API from './apiClient.js';

export async function getMyRepos() {
  const res = await API.get('/api/github/repos');
  return res.data;
}

export async function getRepoBranches(owner, repo) {
  const res = await API.get(`/api/github/repos/${owner}/${repo}/branches`);
  return res.data;
}

export async function getRepoFile(owner, repo, path, branch) {
  const params = new URLSearchParams({ path });
  if (branch) params.append("branch", branch);
  const res = await API.get(`/api/github/repos/${owner}/${repo}/manually-get-file/file?${params.toString()}`);
  return res.data;
}

export async function compareFolderUpload(owner, repo, formData) {
  const res = await API.post(`/api/github/repos/${owner}/${repo}/compare-upload`, formData);
  return res.data;
}

export async function commitFolderUpload(owner, repo, formData) {
  const res = await API.post(`/api/github/repos/${owner}/${repo}/manually-commit`, formData);
  return res.data;
}

export async function createRepoBranch(owner, repo, branchName, sourceBranch) {
  const res = await API.post(`/api/github/repos/${owner}/${repo}/branches`, { branchName, sourceBranch });
  return res.data;
}

export async function renameRemoteFlutterApp(owner, repo, branch, flutterAppName) {
  const res = await API.post(`/api/github/repos/${owner}/${repo}/rename-remote-flutter`, { branch, flutterAppName });
  return res.data;
}

export async function getForkFamilies() {
  const res = await API.get('/api/github/fork-families');
  return res.data;
}

export async function compareForkBranch(parentOwner, parentRepo, parentBranch, forkOwner, forkRepo, forkBranch) {
  const params = new URLSearchParams({
    parentOwner,
    parentRepo,
    parentBranch,
    forkOwner,
    forkRepo,
    forkBranch
  });
  const res = await API.get(`/api/github/fork-families/compare?${params.toString()}`);
  return res.data;
}

export async function mergeForkBranch(parentOwner, parentRepo, parentBranch, forkOwner, forkRepo, forkBranch) {
  const res = await API.post('/api/github/fork-families/merge', {
    parentOwner,
    parentRepo,
    parentBranch,
    forkOwner,
    forkRepo,
    forkBranch
  });
  return res.data;
}

export async function createWebsiteRepo(payload) {
  const res = await API.post('/api/github/create-website-repo', payload);
  return res.data;
}

export async function getUserRepositories() {
  const res = await API.get('/api/github/user-repositories');
  return res.data;
}

export const updateFlutterApp = async (owner, repo, branch, newName, iconFile) => {
  const formData = new FormData();
  formData.append('branch', branch);
  if (newName) formData.append('newName', newName);
  if (iconFile) formData.append('icon', iconFile);

  const res = await API.post(`/api/github/repos/${owner}/${repo}/update-flutter-app`, formData);

  return res.data;
};
