import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import { createStarterWebsiteFiles } from '../services/starterTemplate.service.js';
import { getRepositoriesFromN8n } from '../services/n8n.service.js';
import { createRepoWithFiles } from '../services/githubRepo.service.js';
import { User } from '../models/User.js';

const createWebsiteSchema = z.object({
  repoName: z
    .string()
    .min(3, 'Repo name must be at least 3 characters')
    .max(80, 'Repo name is too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Repo name can only contain letters, numbers, dot, underscore, and dash'),
  isPrivate: z.boolean().default(false),
  description: z.string().max(250).optional().default('Website generated from my builder'),
  templateType: z.enum(['vite-react', 'blank']).default('blank')
});

export async function createWebsiteRepo(req, res, next) {
  try {
    const input = createWebsiteSchema.parse(req.body);
    const user = req.session.githubUser;

    let files = [];

    if (input.templateType !== 'blank') {
      files = createStarterWebsiteFiles({
        repoName: input.repoName,
        username: user.login
      });
    }

    const result = await createRepoWithFiles({
      accessToken: req.session.githubAccessToken,
      repoName: input.repoName,
      description: input.description,
      isPrivate: input.isPrivate,
      files
    });

    res.status(201).json({
      message: 'Repository created successfully.',
      repo: result,
      fileCount: files.length,
      usedN8n: false
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0]?.message || 'Invalid input' });
    }

    // GitHub duplicate repo error commonly returns 422.
    if (err.status === 422) {
      return res.status(422).json({
        message: 'GitHub could not create this repo. The repo name may already exist in your account.'
      });
    }

    next(err);
  }
}

// Helper to determine if a relative path is ignored or dangerous
function isIgnoredOrDangerousPath(relativePath) {
  if (!relativePath) return true;

  const cleanPath = relativePath.replace(/\\/g, '/');

  if (
    cleanPath.includes('../') ||
    cleanPath.startsWith('/') ||
    cleanPath.trim() === ''
  ) {
    return true;
  }

  const segments = cleanPath.split('/');
  const ignoredNames = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '.env',
    '.env.local',
    '.env.production',
    '.DS_Store',
    'package-lock.json'
  ]);

  for (const segment of segments) {
    if (ignoredNames.has(segment)) {
      return true;
    }
    // Ignore hidden files except normal config files like .gitignore
    if (segment.startsWith('.') && segment !== '.gitignore') {
      return true;
    }
  }

  return false;
}

// Helper to calculate Git blob SHA
function calculateGitSha(buffer) {
  const header = `blob ${buffer.length}\0`;
  const hash = crypto.createHash('sha1');
  hash.update(header);
  hash.update(buffer);
  return hash.digest('hex');
}

// Intercept and rename Flutter App Names in memory
function processFlutterRenames(validUploadedFiles, flutterAppName) {
  if (!flutterAppName) return null;

  const cleanAppName = flutterAppName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  if (!cleanAppName) return null;

  let didRename = false;
  for (const item of validUploadedFiles) {
    const p = item.path.toLowerCase();
    if (p.endsWith('macos/runner/configs/appinfo.xcconfig')) {
      let content = item.file.buffer.toString('utf8');
      // Replace PRODUCT_NAME = ...
      content = content.replace(/PRODUCT_NAME\s*=\s*[a-zA-Z0-9._-]+/g, `PRODUCT_NAME = ${cleanAppName}`);
      item.file.buffer = Buffer.from(content, 'utf8');
      item.file.size = item.file.buffer.length;
      // Recompute SHA
      item.sha = calculateGitSha(item.file.buffer);
      didRename = true;
      console.log(`[flutter-rename] Renamed PRODUCT_NAME in AppInfo.xcconfig to: ${cleanAppName}`);
    } else if (p.endsWith('android/app/src/main/androidmanifest.xml')) {
      let content = item.file.buffer.toString('utf8');
      // Replace android:label="..."
      content = content.replace(/android:label="[^"]*"/g, `android:label="${cleanAppName}"`);
      item.file.buffer = Buffer.from(content, 'utf8');
      item.file.size = item.file.buffer.length;
      // Recompute SHA
      item.sha = calculateGitSha(item.file.buffer);
      didRename = true;
      console.log(`[flutter-rename] Renamed android:label in AndroidManifest.xml to: ${cleanAppName}`);
    }
  }
  return didRename ? cleanAppName : null;
}

// 1. Get all accessible user repositories
export async function getUserRepos(req, res, next) {
  try {
    const n8nRepos = await getRepositoriesFromN8n(
      req.session.githubAccessToken,
      req.session.githubUser?.login
    );

    if (n8nRepos !== null) {
      console.log(`[n8n] Successfully fetched user repositories via n8n webhook for /repos: ${req.session.githubUser?.login}`);
      return res.json(n8nRepos);
    }

    console.error(`[n8n] Error: Webhook is offline or failed, and direct GitHub fallback is disabled.`);
    return res.status(503).json({
      message: 'Failed to fetch repositories: the n8n integration is offline or unconfigured.'
    });
  } catch (err) {
    next(err);
  }
}

// 2. Get repository branches
export async function getRepoBranches(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const octokit = new Octokit({ auth: req.session.githubAccessToken });
    try {
      const { data: branches } = await octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });
      res.json(branches.map((b) => b.name));
    } catch (err) {
      if (err.status === 409 && err.message?.includes('Git Repository is empty')) {
        return res.json([]);
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

// 2b. Create a new branch from a source branch
export async function createBranch(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { branchName, sourceBranch } = req.body;

    if (!branchName) {
      return res.status(400).json({ message: 'Branch name is required' });
    }
    if (!sourceBranch) {
      return res.status(400).json({ message: 'Source branch is required' });
    }

    const octokit = new Octokit({ auth: req.session.githubAccessToken });

    let sourceSha;
    try {
      const refRes = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${sourceBranch}`
      });
      sourceSha = refRes.data.object.sha;
    } catch (err) {
      if (err.status === 409 && err.message?.includes('Git Repository is empty')) {
        return res.status(409).json({
          message: 'Cannot create a new branch: the repository is empty. Please push/commit files to initialize the repository first.'
        });
      }
      throw err;
    }

    const cleanBranchName = branchName.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._/-]/g, '');
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${cleanBranchName}`,
      sha: sourceSha
    });

    res.status(201).json({
      success: true,
      message: `Branch "${cleanBranchName}" created successfully from "${sourceBranch}".`,
      branchName: cleanBranchName
    });
  } catch (err) {
    if (err.status === 422) {
      return res.status(422).json({
        message: 'A branch with this name may already exist in GitHub.'
      });
    }
    next(err);
  }
}

// 3. Compare uploaded folder with selected GitHub branch tree
export async function compareUpload(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { branch, includeDeletions = 'false' } = req.body;

    if (!branch) {
      return res.status(400).json({ message: 'Branch is required' });
    }

    const octokit = new Octokit({ auth: req.session.githubAccessToken });
    const uploadedFiles = req.files || [];

    let relativePaths = [];
    if (req.body.paths) {
      try {
        relativePaths = JSON.parse(req.body.paths);
      } catch (e) {
        console.warn('Failed to parse paths JSON', e);
      }
    }

    const maxFiles = 500;
    if (uploadedFiles.length > maxFiles) {
      return res.status(400).json({ message: `Max upload limit exceeded (Max: ${maxFiles} files)` });
    }

    const validUploadedFiles = [];
    let ignoredCount = 0;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const relPath = relativePaths[i] || file.originalname || file.name;

      if (isIgnoredOrDangerousPath(relPath)) {
        ignoredCount++;
        continue;
      }

      validUploadedFiles.push({
        file,
        path: relPath.replace(/\\/g, '/'),
        sha: calculateGitSha(file.buffer)
      });
    }

    const flutterAppName = req.body.flutterAppName;
    const renamedTo = processFlutterRenames(validUploadedFiles, flutterAppName);

    const remoteFilesMap = new Map();
    const remotePaths = new Set();
    let latestCommitSha = null;

    try {
      const refRes = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`
      });
      latestCommitSha = refRes.data.object.sha;

      const commitRes = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha
      });
      const treeSha = commitRes.data.tree.sha;

      const treeRes = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: '1'
      });

      for (const node of treeRes.data.tree) {
        if (node.type === 'blob') {
          remoteFilesMap.set(node.path, node.sha);
          remotePaths.add(node.path);
        }
      }
    } catch (err) {
      console.warn(`[compare] Could not fetch remote tree (status: ${err.status}), treating remote as empty:`, err.message);
    }

    const added = [];
    const modified = [];
    const unchanged = [];
    const localPaths = new Set();

    for (const item of validUploadedFiles) {
      localPaths.add(item.path);

      if (!remoteFilesMap.has(item.path)) {
        added.push(item.path);
      } else {
        const remoteSha = remoteFilesMap.get(item.path);
        if (remoteSha !== item.sha) {
          modified.push(item.path);
        } else {
          unchanged.push(item.path);
        }
      }
    }

    const deleted = [];
    for (const remotePath of remotePaths) {
      if (!localPaths.has(remotePath)) {
        if (isIgnoredOrDangerousPath(remotePath)) {
          continue;
        }
        deleted.push(remotePath);
      }
    }

    res.json({
      success: true,
      summary: {
        added,
        modified,
        deleted: includeDeletions === 'true' ? deleted : [],
        unchangedCount: unchanged.length,
        ignoredCount,
        renamedTo
      }
    });

  } catch (err) {
    next(err);
  }
}

// 4. Atomic Commit & Push to branch using GitHub Git Database API
export async function commitUpload(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { branch, commitMessage = 'Upload project files from dashboard', includeDeletions = 'false' } = req.body;

    if (!branch) {
      return res.status(400).json({ message: 'Branch is required' });
    }

    const octokit = new Octokit({ auth: req.session.githubAccessToken });
    const uploadedFiles = req.files || [];

    let relativePaths = [];
    if (req.body.paths) {
      try {
        relativePaths = JSON.parse(req.body.paths);
      } catch (e) {
        console.warn('Failed to parse paths JSON', e);
      }
    }

    const maxFiles = 500;
    if (uploadedFiles.length > maxFiles) {
      return res.status(400).json({ message: `Max upload limit exceeded (Max: ${maxFiles} files)` });
    }

    const validUploadedFiles = [];
    let ignoredCount = 0;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const relPath = relativePaths[i] || file.originalname || file.name;

      if (isIgnoredOrDangerousPath(relPath)) {
        ignoredCount++;
        continue;
      }

      validUploadedFiles.push({
        file,
        path: relPath.replace(/\\/g, '/'),
        sha: calculateGitSha(file.buffer)
      });
    }

    const flutterAppName = req.body.flutterAppName;
    const renamedTo = processFlutterRenames(validUploadedFiles, flutterAppName);

    let latestCommitSha = null;
    let isInitialCommit = false;

    try {
      const refRes = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`
      });
      latestCommitSha = refRes.data.object.sha;

      // Verify commit actually exists on GitHub (fails with 500/404/409 if empty repo or invalid head ref)
      await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha
      });
    } catch (err) {
      console.warn(`[commit] Branch ref or commit not resolvable (status: ${err.status}), setting isInitialCommit = true:`, err.message);
      isInitialCommit = true;
    }

    let remoteBlobs = [];
    if (!isInitialCommit) {
      const commitRes = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha
      });
      const latestTreeSha = commitRes.data.tree.sha;

      const treeRes = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: latestTreeSha,
        recursive: '1'
      });

      remoteBlobs = treeRes.data.tree.filter((node) => node.type === 'blob');
    }

    const remoteFilesMap = new Map(remoteBlobs.map((node) => [node.path, node]));

    const addedPaths = [];
    const modifiedPaths = [];
    const unchangedPaths = [];
    const localPaths = new Set();
    const filesToUpload = [];

    let selectedPaths = null;
    if (req.body.selectedPaths) {
      try {
        selectedPaths = new Set(JSON.parse(req.body.selectedPaths));
      } catch (e) {
        console.warn('Failed to parse selectedPaths JSON', e);
      }
    }

    for (const item of validUploadedFiles) {
      localPaths.add(item.path);

      // If selectedPaths is provided, ignore files that aren't selected
      if (selectedPaths && !selectedPaths.has(item.path)) {
        continue;
      }

      if (!remoteFilesMap.has(item.path)) {
        addedPaths.push(item.path);
        filesToUpload.push(item);
      } else {
        const remoteNode = remoteFilesMap.get(item.path);
        if (remoteNode.sha !== item.sha) {
          modifiedPaths.push(item.path);
          filesToUpload.push(item);
        } else {
          unchangedPaths.push(item.path);
        }
      }
    }

    const deletedPaths = [];
    for (const remoteBlob of remoteBlobs) {
      if (!localPaths.has(remoteBlob.path)) {
        if (!isIgnoredOrDangerousPath(remoteBlob.path)) {
          deletedPaths.push(remoteBlob.path);
        }
      }
    }

    const actuallyDeleting = includeDeletions === 'true';
    if (filesToUpload.length === 0 && (!actuallyDeleting || deletedPaths.length === 0 || (selectedPaths && !deletedPaths.some(p => selectedPaths.has(p))))) {
      return res.status(400).json({
        success: false,
        message: 'No changes detected. Uploaded files are identical to the remote branch files.'
      });
    }

    // Create blobs for changed files
    const blobPromises = filesToUpload.map(async (item) => {
      const blobRes = await octokit.git.createBlob({
        owner,
        repo,
        content: item.file.buffer.toString('base64'),
        encoding: 'base64'
      });
      return {
        path: item.path,
        sha: blobRes.data.sha
      };
    });

    const newBlobs = await Promise.all(blobPromises);
    const newBlobsMap = new Map(newBlobs.map((b) => [b.path, b.sha]));

    const finalTreeNodes = [];

    // Keep unchanged remote blobs
    for (const remoteBlob of remoteBlobs) {
      const path = remoteBlob.path;

      if (actuallyDeleting && deletedPaths.includes(path)) {
        const isDeletionSelected = selectedPaths ? selectedPaths.has(path) : true;
        if (isDeletionSelected) {
          continue;
        }
      }

      if (newBlobsMap.has(path)) {
        continue;
      }

      finalTreeNodes.push({
        path: remoteBlob.path,
        mode: remoteBlob.mode,
        type: remoteBlob.type,
        sha: remoteBlob.sha
      });
    }

    // Add updated or new blobs
    for (const blob of newBlobs) {
      finalTreeNodes.push({
        path: blob.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    }

    const newTreeRes = await octokit.git.createTree({
      owner,
      repo,
      tree: finalTreeNodes
    });
    const newTreeSha = newTreeRes.data.sha;

    const commitParams = {
      owner,
      repo,
      message: commitMessage,
      tree: newTreeSha
    };
    if (!isInitialCommit) {
      commitParams.parents = [latestCommitSha];
    }

    const newCommitRes = await octokit.git.createCommit(commitParams);
    const newCommitSha = newCommitRes.data.sha;

    if (isInitialCommit) {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: newCommitSha
      });
    } else {
      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommitSha
      });
    }

    res.json({
      success: true,
      message: 'Changes pushed successfully',
      commitSha: newCommitSha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
      branchUrl: `https://github.com/${owner}/${repo}/tree/${branch}`,
      summary: {
        added: addedPaths.length,
        modified: modifiedPaths.length,
        deleted: actuallyDeleting ? deletedPaths.length : 0,
        unchanged: unchangedPaths.length,
        ignored: ignoredCount,
        renamedTo
      }
    });

  } catch (err) {
    next(err);
  }
}

// 5. Rename remote Flutter application files directly in-place
export async function renameRemoteFlutterApp(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { branch, flutterAppName } = req.body;

    if (!branch) {
      return res.status(400).json({ message: 'Branch is required' });
    }
    if (!flutterAppName) {
      return res.status(400).json({ message: 'Flutter App Name is required' });
    }

    const cleanAppName = flutterAppName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    if (!cleanAppName) {
      return res.status(400).json({ message: 'Invalid Flutter App Name' });
    }

    const octokit = new Octokit({ auth: req.session.githubAccessToken });

    // 1. Get branch ref
    const refRes = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`
    });
    const latestCommitSha = refRes.data.object.sha;

    // 2. Get commit details
    const commitRes = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha
    });
    const treeSha = commitRes.data.tree.sha;

    // 3. Get recursive tree
    const treeRes = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: treeSha,
      recursive: '1'
    });

    const finalTreeNodes = [];
    let updatedFilesCount = 0;

    for (const node of treeRes.data.tree) {
      if (node.type === 'blob') {
        const pathLower = node.path.toLowerCase();
        const isAppInfo = pathLower.endsWith('macos/runner/configs/appinfo.xcconfig');
        const isManifest = pathLower.endsWith('android/app/src/main/androidmanifest.xml');

        if (isAppInfo || isManifest) {
          // Fetch existing blob content
          const blobRes = await octokit.git.getBlob({
            owner,
            repo,
            file_sha: node.sha
          });
          
          let content = Buffer.from(blobRes.data.content, blobRes.data.encoding).toString('utf8');
          
          if (isAppInfo) {
            content = content.replace(/PRODUCT_NAME\s*=\s*[a-zA-Z0-9._-]+/g, `PRODUCT_NAME = ${cleanAppName}`);
          } else if (isManifest) {
            content = content.replace(/android:label="[^"]*"/g, `android:label="${cleanAppName}"`);
          }

          // Create new blob
          const newBlobRes = await octokit.git.createBlob({
            owner,
            repo,
            content: Buffer.from(content, 'utf8').toString('base64'),
            encoding: 'base64'
          });

          finalTreeNodes.push({
            path: node.path,
            mode: node.mode,
            type: 'blob',
            sha: newBlobRes.data.sha
          });
          updatedFilesCount++;
          console.log(`[remote-rename] Modified in-memory remote blob for ${node.path}`);
        } else {
          // Keep existing blob unchanged
          finalTreeNodes.push({
            path: node.path,
            mode: node.mode,
            type: 'blob',
            sha: node.sha
          });
        }
      }
    }

    if (updatedFilesCount === 0) {
      return res.status(404).json({
        message: 'No Flutter configuration files found on the remote branch. Verify AppInfo.xcconfig or AndroidManifest.xml exists.'
      });
    }

    // 4. Create new tree
    const newTreeRes = await octokit.git.createTree({
      owner,
      repo,
      tree: finalTreeNodes
    });
    const newTreeSha = newTreeRes.data.sha;

    // 5. Create commit
    const newCommitRes = await octokit.git.createCommit({
      owner,
      repo,
      message: `Rename Flutter application to: ${cleanAppName} (direct remote update)`,
      tree: newTreeSha,
      parents: [latestCommitSha]
    });
    const newCommitSha = newCommitRes.data.sha;

    // 6. Update ref
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommitSha
    });

    res.json({
      success: true,
      message: `Remote Flutter application renamed to "${cleanAppName}" successfully.`,
      commitSha: newCommitSha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
      branchUrl: `https://github.com/${owner}/${repo}/tree/${branch}`,
      summary: {
        added: 0,
        modified: updatedFilesCount,
        deleted: 0,
        unchanged: treeRes.data.tree.length - updatedFilesCount,
        ignored: 0,
        renamedTo: cleanAppName
      }
    });
  } catch (err) {
    next(err);
  }
}
