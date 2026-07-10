const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export function loginWithGitHub() {
  window.location.href = `${API_BASE_URL}/api/auth/github`;
}

export async function getMe() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: 'include'
  });

  if (!res.ok) return { authenticated: false };
  return res.json();
}

export async function logout() {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  return res.json();
}

export async function createWebsiteRepo(payload) {
  const res = await fetch(`${API_BASE_URL}/api/github/create-website-repo`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Failed to create repo');
  }

  return data;
}


export async function getUserRepositories() {
  const res = await fetch(`${API_BASE_URL}/api/github/user-repositories`, {
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user repositories from GitHub');
  }

  return res.json();
}
