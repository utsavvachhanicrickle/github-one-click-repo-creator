const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export async function getMyRepos() {
  const res = await fetch(`${API_BASE_URL}/api/github/repos?_t=${Date.now()}`, {
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch GitHub repositories');
  }
  return res.json();
}

export async function getRepoBranches(owner, repo) {
  const res = await fetch(`${API_BASE_URL}/api/github/repos/${owner}/${repo}/branches?_t=${Date.now()}`, {
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

export async function renameRemoteFlutterApp(owner, repo, branch, flutterAppName) {
  const res = await fetch(`${API_BASE_URL}/api/github/repos/${owner}/${repo}/rename-remote-flutter`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ branch, flutterAppName })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to rename remote Flutter app');
  }
  return data;
}

export async function getForkFamilies() {
  const res = await fetch(`${API_BASE_URL}/api/github/fork-families?_t=${Date.now()}`, {
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch fork families');
  }
  return res.json();
}

export async function compareForkBranch(parentOwner, parentRepo, parentBranch, forkOwner, forkRepo, forkBranch) {
  const params = new URLSearchParams({
    parentOwner,
    parentRepo,
    parentBranch,
    forkOwner,
    forkRepo,
    forkBranch,
    _t: Date.now().toString()
  });
  const res = await fetch(`${API_BASE_URL}/api/github/fork-families/compare?${params.toString()}`, {
    credentials: 'include'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to compare branches');
  }
  return res.json();
}

export async function mergeForkBranch(parentOwner, parentRepo, parentBranch, forkOwner, forkRepo, forkBranch) {
  const res = await fetch(`${API_BASE_URL}/api/github/fork-families/merge`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parentOwner,
      parentRepo,
      parentBranch,
      forkOwner,
      forkRepo,
      forkBranch
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to merge parent branch into fork');
  }
  return data;
}
