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

export async function loginWithEmailAndPassword(email, password) {
  const res = await API.post('/api/auth/login', { email, password });
  return res.data;
}

export async function registerWithEmailAndPassword(email, password, name) {
  const res = await API.post('/api/auth/register-user', { email, password, name });
  return res.data;
}
