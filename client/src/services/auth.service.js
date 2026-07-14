import API from './apiClient.js';

export function loginWithGitHub() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  window.location.href = `${API_BASE_URL}/api/auth/github`;
}

export async function getMe() {
  try {
    const res = await API.get('/api/auth/me');
    return res.data;
  } catch {
    return { authenticated: false };
  }
}

export async function logout() {
  const res = await API.post('/api/auth/logout');
  return res.data;
}
