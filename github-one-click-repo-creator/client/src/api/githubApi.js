const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export async function getMyRepos() {
  const res = await fetch(`${API_BASE_URL}/api/github/repos`, {
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch GitHub repositories');
  }
  return res.json();
}

export async function getRepoBranches(owner, repo) {
  const res = await fetch(`${API_BASE_URL}/api/github/repos/${owner}/${repo}/branches`, {
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch branches');
  }
  return res.json();
}

export async function compareFolderUpload(owner, repo, formData) {
  const res = await fetch(`${API_BASE_URL}/api/github/repos/${owner}/${repo}/compare-upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to compare folder upload');
  }
  return data;
}

export async function commitFolderUpload(owner, repo, formData) {
  const res = await fetch(`${API_BASE_URL}/api/github/repos/${owner}/${repo}/commit-upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to commit and push changes');
  }
  return data;
}

export async function createRepoBranch(owner, repo, branchName, sourceBranch) {
  const res = await fetch(`${API_BASE_URL}/api/github/repos/${owner}/${repo}/branches`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ branchName, sourceBranch })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create new branch');
  }
  return data;
}
