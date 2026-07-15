import API from './apiClient.js';

export async function createStoreRepo(storeName) {
  const res = await API.post('/api/store/create-store-repo', { storeName });
  return res.data;
}

export async function getStoreRepos() {
  const res = await API.post('/api/store/get-store-repo');
  return res.data;
}
