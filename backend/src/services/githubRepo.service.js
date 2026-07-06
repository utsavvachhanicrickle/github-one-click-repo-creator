import { Octokit } from '@octokit/rest';

function toBase64(content) {
  return Buffer.from(content, 'utf8').toString('base64');
}

export async function createRepoWithFiles({ accessToken, repoName, description, isPrivate, files }) {
  const octokit = new Octokit({ auth: accessToken });

  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;

  const hasFiles = Array.isArray(files) && files.length > 0;

  // Create repository. Set auto_init to true only if there are files to commit.
  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name: repoName,
    description,
    private: isPrivate,
    auto_init: hasFiles,
    has_issues: true,
    has_projects: false,
    has_wiki: false
  });

  if (!hasFiles) {
    return {
      owner,
      repoName,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch || 'main',
      commitSha: null
    };
  }

  // Wait a short moment for the repository database to be provisioned and ready on GitHub.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const defaultBranch = repo.default_branch || 'main';

  // Get the latest commit SHA of the default branch
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo: repoName,
    ref: `heads/${defaultBranch}`
  });
  const baseCommitSha = ref.object.sha;

  // Get the base tree SHA of the initial commit
  const { data: baseCommit } = await octokit.git.getCommit({
    owner,
    repo: repoName,
    commit_sha: baseCommitSha
  });
  const baseTreeSha = baseCommit.tree.sha;

  // Build website files.
  const treeItems = [];

  for (const file of files) {
    const { data: blob } = await octokit.git.createBlob({
      owner,
      repo: repoName,
      content: toBase64(file.content),
      encoding: 'base64'
    });

    treeItems.push({
      path: file.path,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    });
  }

  // Create new tree using the base tree (appends/replaces files)
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo: repoName,
    tree: treeItems,
    base_tree: baseTreeSha
  });

  // Create commit with base commit as parent
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo: repoName,
    message: 'Initial website generated from builder',
    tree: tree.sha,
    parents: [baseCommitSha]
  });

  // Update default branch reference to point to our new commit
  await octokit.git.updateRef({
    owner,
    repo: repoName,
    ref: `heads/${defaultBranch}`,
    sha: commit.sha,
    force: true
  });

  return {
    owner,
    repoName,
    htmlUrl: repo.html_url,
    cloneUrl: repo.clone_url,
    defaultBranch,
    commitSha: commit.sha
  };
}
