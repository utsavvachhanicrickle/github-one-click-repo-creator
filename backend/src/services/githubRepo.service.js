import { Octokit } from "@octokit/rest";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function cloneRepoWithHistory({ accessToken, repoName, description, isPrivate, sourceRepoUrl }) {
  const octokit = new Octokit({ auth: accessToken });

  // 1. Get authenticated user details
  const { data: user } = await octokit.users.getAuthenticated();
  const owner = user.login;

  // 2. Create a new empty repository via GitHub API
  const { data: repo } = await octokit.repos.createForAuthenticatedUser({
    name: repoName,
    description: description || "",
    private: isPrivate,
    auto_init: false, // Must be false so we can mirror push directly
    has_issues: true,
    has_projects: false,
    has_wiki: false,
  });

  // 3. Create a temporary directory for the clone
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "repo-sync-"));

  try {
    // 4. Git clone --bare from the source URL
    await new Promise((resolve, reject) => {
      exec(`git clone --bare ${sourceRepoUrl} .`, { cwd: tmpDir }, (error, stdout, stderr) => {
        if (error) return reject(new Error(`Failed to clone template repository: ${error.message}`));
        resolve();
      });
    });

    // 5. Git push --mirror to the new repository with the access token for auth
    const newRepoUrl = `https://x-access-token:${accessToken}@github.com/${owner}/${repoName}.git`;
    await new Promise((resolve, reject) => {
      exec(`git push --mirror ${newRepoUrl}`, { cwd: tmpDir }, (error, stdout, stderr) => {
        if (error) return reject(new Error(`Failed to push mirrored repository: ${error.message}`));
        resolve();
      });
    });
  } finally {
    // 6. Clean up the temporary directory
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);
  }

  // 7. Get final details to return
  const { data: updatedRepo } = await octokit.repos.get({ owner, repo: repoName });
  const defaultBranch = updatedRepo.default_branch || "main";

  let commitSha = "";
  try {
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
    });
    commitSha = ref.object.sha;
  } catch (e) {
    console.warn("Failed to get commit SHA after mirror push:", e.message);
  }

  return {
    repoName,
    owner,
    htmlUrl: updatedRepo.html_url,
    cloneUrl: updatedRepo.clone_url,
    defaultBranch,
    commitSha,
  };
}
