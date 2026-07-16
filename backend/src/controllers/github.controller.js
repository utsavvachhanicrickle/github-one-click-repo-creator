import { z } from "zod";
import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import { cloneRepoWithHistory } from "../services/githubRepo.service.js";
import { generateAndCommitAppIcons } from "../services/appIcon.service.js";
import { getIo } from "../socket.js";

const createWebsiteSchema = z.object({
  repoName: z
    .string()
    .min(3, "Repo name must be at least 3 characters")
    .max(80, "Repo name is too long")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Repo name can only contain letters, numbers, dot, underscore, and dash",
    ),
  isPrivate: z.boolean().default(false),
  description: z
    .string()
    .max(250)
    .optional()
    .default("Website generated from my builder"),
  templateType: z.enum(["vite-react", "blank"]).default("blank"),
});

export async function createWebsiteRepo(req, res, next) {
  try {
    const input = createWebsiteSchema.parse(req.body);
    // 3. Create the new repository using the true clone approach
    const result = await cloneRepoWithHistory({
      accessToken: req.session.githubAccessToken,
      repoName: input.repoName,
      description: input.description,
      isPrivate: true,
      sourceRepoUrl: "https://github.com/utsavvachhanicrickle/flutter_demo.git"
    });

    res.status(201).json({
      message:
        "Repository created successfully with automation template files.",
      repo: result,
      usedN8n: false,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: err.errors[0]?.message || "Invalid input" });
    }

    if (err.status === 422) {
      return res.status(422).json({
        message:
          "GitHub could not create this repo. The repo name may already exist in your account.",
      });
    }

    next(err);
  }
}

// Helper to determine if a relative path is ignored or dangerous
function isIgnoredOrDangerousPath(relativePath) {
  if (!relativePath) return true;

  const cleanPath = relativePath.replace(/\\/g, "/");

  if (
    cleanPath.includes("../") ||
    cleanPath.startsWith("/") ||
    cleanPath.trim() === ""
  ) {
    return true;
  }

  const segments = cleanPath.split("/");
  const ignoredNames = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".env",
    ".env.local",
    ".env.production",
    ".DS_Store",
    "package-lock.json",
  ]);

  for (const segment of segments) {
    if (ignoredNames.has(segment)) {
      return true;
    }
    // Ignore hidden files except normal config files like .gitignore
    if (segment.startsWith(".") && segment !== ".gitignore") {
      return true;
    }
  }

  return false;
}

// Helper to calculate Git blob SHA
function calculateGitSha(buffer) {
  const header = `blob ${buffer.length}\0`;
  const hash = crypto.createHash("sha1");
  hash.update(header);
  hash.update(buffer);
  return hash.digest("hex");
}

// Intercept and rename Flutter App Names in memory
function processFlutterRenames(validUploadedFiles, flutterAppName) {
  if (!flutterAppName) return null;

  const cleanAppName = flutterAppName
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
  if (!cleanAppName) return null;

  let didRename = false;
  for (const item of validUploadedFiles) {
    const p = item.path.toLowerCase();
    if (p.endsWith("macos/runner/configs/appinfo.xcconfig")) {
      let content = item.file.buffer.toString("utf8");
      // Replace PRODUCT_NAME = ...
      content = content.replace(
        /PRODUCT_NAME\s*=\s*[a-zA-Z0-9._-]+/g,
        `PRODUCT_NAME = ${cleanAppName}`,
      );
      item.file.buffer = Buffer.from(content, "utf8");
      item.file.size = item.file.buffer.length;
      // Recompute SHA
      item.sha = calculateGitSha(item.file.buffer);
      didRename = true;
      console.log(
        `[flutter-rename] Renamed PRODUCT_NAME in AppInfo.xcconfig to: ${cleanAppName}`,
      );
    } else if (p.endsWith("android/app/src/main/androidmanifest.xml")) {
      let content = item.file.buffer.toString("utf8");
      // Replace android:label="..."
      content = content.replace(
        /android:label="[^"]*"/g,
        `android:label="${cleanAppName}"`,
      );
      item.file.buffer = Buffer.from(content, "utf8");
      item.file.size = item.file.buffer.length;
      // Recompute SHA
      item.sha = calculateGitSha(item.file.buffer);
      didRename = true;
      console.log(
        `[flutter-rename] Renamed android:label in AndroidManifest.xml to: ${cleanAppName}`,
      );
    }
  }
  return didRename ? cleanAppName : null;
}

// 1. Get all accessible user repositories
export async function getUserRepos(req, res, next) {
  try {
    const octokit = new Octokit({ auth: req.session.githubAccessToken });
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    const formattedRepos = repos.map((r) => ({
      name: r.name,
      owner: r.owner.login,
      isPrivate: r.private,
      defaultBranch: r.default_branch,
      updatedAt: r.updated_at,
      language: r.language,
      htmlUrl: r.html_url,
    }));

    res.json(formattedRepos);
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
        per_page: 100,
      });
      res.json(branches.map((b) => b.name));
    } catch (err) {
      if (
        err.status === 409 &&
        err.message?.includes("Git Repository is empty")
      ) {
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
      return res.status(400).json({ message: "Branch name is required" });
    }
    if (!sourceBranch) {
      return res.status(400).json({ message: "Source branch is required" });
    }

    const octokit = new Octokit({ auth: req.session.githubAccessToken });

    let sourceSha;
    try {
      const refRes = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${sourceBranch}`,
      });
      sourceSha = refRes.data.object.sha;
    } catch (err) {
      if (
        err.status === 409 &&
        err.message?.includes("Git Repository is empty")
      ) {
        return res.status(409).json({
          message:
            "Cannot create a new branch: the repository is empty. Please push/commit files to initialize the repository first.",
        });
      }
      throw err;
    }

    const cleanBranchName = branchName
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._/-]/g, "");
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${cleanBranchName}`,
      sha: sourceSha,
    });

    res.status(201).json({
      success: true,
      message: `Branch "${cleanBranchName}" created successfully from "${sourceBranch}".`,
      branchName: cleanBranchName,
    });
  } catch (err) {
    if (err.status === 422) {
      return res.status(422).json({
        message: "A branch with this name may already exist in GitHub.",
      });
    }
    next(err);
  }
}

// 3. Compare uploaded folder with selected GitHub branch tree
export async function compareUpload(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { branch, includeDeletions = "false" } = req.body;

    if (!branch) {
      return res.status(400).json({ message: "Branch is required" });
    }

    const octokit = new Octokit({ auth: req.session.githubAccessToken });
    const uploadedFiles = req.files || [];

    let relativePaths = [];
    if (req.body.paths) {
      try {
        relativePaths = JSON.parse(req.body.paths);
      } catch (e) {
        console.warn("Failed to parse paths JSON", e);
      }
    }

    const maxFiles = 500;
    if (uploadedFiles.length > maxFiles) {
      return res
        .status(400)
        .json({
          message: `Max upload limit exceeded (Max: ${maxFiles} files)`,
        });
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
        path: relPath.replace(/\\/g, "/"),
        sha: calculateGitSha(file.buffer),
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
        ref: `heads/${branch}`,
      });
      latestCommitSha = refRes.data.object.sha;

      const commitRes = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha,
      });
      const treeSha = commitRes.data.tree.sha;

      const treeRes = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: treeSha,
        recursive: "1",
      });

      for (const node of treeRes.data.tree) {
        if (node.type === "blob") {
          remoteFilesMap.set(node.path, node.sha);
          remotePaths.add(node.path);
        }
      }
    } catch (err) {
      console.warn(
        `[compare] Could not fetch remote tree (status: ${err.status}), treating remote as empty:`,
        err.message,
      );
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
        deleted: includeDeletions === "true" ? deleted : [],
        unchangedCount: unchanged.length,
        ignoredCount,
        renamedTo,
      },
    });
  } catch (err) {
    next(err);
  }
}

// 4. Atomic Commit & Push to branch using GitHub Git Database API
export async function commitUpload(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const {
      branch,
      commitMessage,
      includeDeletions = "false",
      socketId,
    } = req.body;

    const emitLog = (message, type = "info") => {
      if (socketId) {
        try {
          getIo()
            .to(socketId)
            .emit("upload_progress", {
              message,
              type,
              timestamp: new Date().toISOString(),
            });
        } catch (e) {
          console.warn("Socket error:", e);
        }
      }
    };

    if (!branch) {
      return res.status(400).json({ message: "Branch is required" });
    }

    emitLog(
      `Starting upload process for repository: ${owner}/${repo} on branch ${branch}...`,
    );

    const octokit = new Octokit({ auth: req.session.githubAccessToken });
    const uploadedFiles = req.files || [];

    let relativePaths = [];
    if (req.body.paths) {
      try {
        relativePaths = JSON.parse(req.body.paths);
      } catch (e) {
        console.warn("Failed to parse paths JSON", e);
      }
    }

    const maxFiles = 500;
    if (uploadedFiles.length > maxFiles) {
      return res
        .status(400)
        .json({
          message: `Max upload limit exceeded (Max: ${maxFiles} files)`,
        });
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
        path: relPath.replace(/\\/g, "/"),
        sha: calculateGitSha(file.buffer),
      });
    }

    const flutterAppName = req.body.flutterAppName;
    const renamedTo = processFlutterRenames(validUploadedFiles, flutterAppName);

    emitLog(
      `Processed ${validUploadedFiles.length} files (Ignored ${ignoredCount} invalid/system files). Fetching latest branch state...`,
    );

    let latestCommitSha = null;
    let isInitialCommit = false;

    try {
      const refRes = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      latestCommitSha = refRes.data.object.sha;

      // Verify commit actually exists on GitHub (fails with 500/404/409 if empty repo or invalid head ref)
      await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha,
      });
    } catch (err) {
      console.warn(
        `[commit] Branch ref or commit not resolvable (status: ${err.status}), setting isInitialCommit = true:`,
        err.message,
      );
      isInitialCommit = true;
    }

    let remoteBlobs = [];
    if (!isInitialCommit) {
      const commitRes = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: latestCommitSha,
      });
      const latestTreeSha = commitRes.data.tree.sha;

      const treeRes = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: latestTreeSha,
        recursive: "1",
      });

      remoteBlobs = treeRes.data.tree.filter((node) => node.type === "blob");
    }

    const remoteFilesMap = new Map(
      remoteBlobs.map((node) => [node.path, node]),
    );

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
        console.warn("Failed to parse selectedPaths JSON", e);
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

    const actuallyDeleting = includeDeletions === "true";
    if (
      filesToUpload.length === 0 &&
      (!actuallyDeleting ||
        deletedPaths.length === 0 ||
        (selectedPaths && !deletedPaths.some((p) => selectedPaths.has(p))))
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No changes detected. Uploaded files are identical to the remote branch files.",
      });
    }

    emitLog(
      `Analyzing differences. Found ${filesToUpload.length} file(s) that need uploading.`,
    );

    let completedBlobs = 0;
    const totalBlobs = filesToUpload.length;

    if (totalBlobs > 0 && socketId) {
      try {
        getIo()
          .to(socketId)
          .emit("upload_progress_percent", {
            completed: 0,
            total: totalBlobs,
            percentage: 0,
          });
      } catch (e) {}
    }

    // Create blobs for changed files
    const blobPromises = filesToUpload.map(async (item) => {
      const blobRes = await octokit.git.createBlob({
        owner,
        repo,
        content: item.file.buffer.toString("base64"),
        encoding: "base64",
      });

      completedBlobs++;
      if (socketId) {
        try {
          getIo()
            .to(socketId)
            .emit("upload_progress_percent", {
              completed: completedBlobs,
              total: totalBlobs,
              percentage: Math.round((completedBlobs / totalBlobs) * 100),
            });
        } catch (e) {
          console.warn("Socket error:", e);
        }
      }

      return {
        path: item.path,
        sha: blobRes.data.sha,
      };
    });

    const newBlobs = await Promise.all(blobPromises);
    const newBlobsMap = new Map(newBlobs.map((b) => [b.path, b.sha]));

    const finalTreeNodes = [];

    // Keep unchanged remote blobs
    for (const remoteBlob of remoteBlobs) {
      const path = remoteBlob.path;

      if (actuallyDeleting && deletedPaths.includes(path)) {
        const isDeletionSelected = selectedPaths
          ? selectedPaths.has(path)
          : true;
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
        sha: remoteBlob.sha,
      });
    }

    // Add updated or new blobs
    for (const blob of newBlobs) {
      finalTreeNodes.push({
        path: blob.path,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      });
    }

    emitLog(`Building the new commit tree structure...`);
    const newTreeRes = await octokit.git.createTree({
      owner,
      repo,
      tree: finalTreeNodes,
    });
    const newTreeSha = newTreeRes.data.sha;

    emitLog(`Creating commit in GitHub with message: "${commitMessage}"...`);
    const commitParams = {
      owner,
      repo,
      message: commitMessage || "Upload project files from dashboard",
      tree: newTreeSha,
    };
    if (!isInitialCommit) {
      commitParams.parents = [latestCommitSha];
    }

    const newCommitRes = await octokit.git.createCommit(commitParams);
    const newCommitSha = newCommitRes.data.sha;

    emitLog(`Updating branch ${branch} to new commit reference...`);
    if (isInitialCommit) {
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: newCommitSha,
      });
    } else {
      await octokit.git.updateRef({
        owner,
        repo,
        ref: `heads/${branch}`,
        sha: newCommitSha,
      });
    }

    emitLog(`Upload process completed successfully!`, "success");

    res.json({
      success: true,
      message: "Changes pushed successfully",
      commitSha: newCommitSha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitSha}`,
      branchUrl: `https://github.com/${owner}/${repo}/tree/${branch}`,
      summary: {
        added: addedPaths.length,
        modified: modifiedPaths.length,
        deleted: actuallyDeleting ? deletedPaths.length : 0,
        unchanged: unchangedPaths.length,
        ignored: ignoredCount,
        renamedTo,
      },
    });
  } catch (err) {
    next(err);
  }
}

// 5. Update remote Flutter application settings (Name and/or Icons)
export async function updateFlutterApp(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { branch = "main", newName, commitMessage } = req.body;
    const file = req.file;

    if (!branch) return res.status(400).json({ message: "Branch is required" });
    if (!newName && !file)
      return res
        .status(400)
        .json({ message: "Either newName or app icon is required" });

    const octokit = new Octokit({ auth: req.session.githubAccessToken });
    const io = getIo();
    const emitLog = (msg) =>
      io.emit("upload_log", { repoFullName: `${owner}/${repo}`, message: msg });
    const emitProgress = (progress, statusText) =>
      io.emit("upload_progress", {
        repoFullName: `${owner}/${repo}`,
        progress,
        status: statusText,
      });

    const finalTreeNodes = [];
    let cleanAppName = null;

    if (newName) {
      cleanAppName = newName
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      if (!cleanAppName)
        return res.status(400).json({ message: "Invalid Flutter App Name" });
    }

    emitLog("Fetching current branch state...");
    const refRes = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const latestCommitSha = refRes.data.object.sha;

    const commitRes = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitRes.data.tree.sha;

    if (cleanAppName) {
      emitLog("Fetching remote file tree to rename app...");
      const treeRes = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: baseTreeSha,
        recursive: "1",
      });
      let updatedFilesCount = 0;
      for (const node of treeRes.data.tree) {
        if (node.type === "blob") {
          const pathLower = node.path.toLowerCase();
          const isAppInfo = pathLower.endsWith(
            "macos/runner/configs/appinfo.xcconfig",
          );
          const isManifest = pathLower.endsWith(
            "android/app/src/main/androidmanifest.xml",
          );

          if (isAppInfo || isManifest) {
            const blobRes = await octokit.git.getBlob({
              owner,
              repo,
              file_sha: node.sha,
            });
            let content = Buffer.from(
              blobRes.data.content,
              blobRes.data.encoding,
            ).toString("utf8");
            if (isAppInfo)
              content = content.replace(
                /PRODUCT_NAME\s*=\s*[a-zA-Z0-9._-]+/g,
                `PRODUCT_NAME = ${cleanAppName}`,
              );
            else if (isManifest)
              content = content.replace(
                /android:label="[^"]*"/g,
                `android:label="${cleanAppName}"`,
              );

            const newBlobRes = await octokit.git.createBlob({
              owner,
              repo,
              content: Buffer.from(content, "utf8").toString("base64"),
              encoding: "base64",
            });
            finalTreeNodes.push({
              path: node.path,
              mode: node.mode,
              type: "blob",
              sha: newBlobRes.data.sha,
            });
            updatedFilesCount++;
            emitLog(`Modified in-memory remote blob for ${node.path}`);
          }
        }
      }
      if (updatedFilesCount === 0) {
        emitLog(
          `Warning: No Flutter configuration files found to rename on the remote branch.`,
        );
      }
    }

    if (file) {
      emitLog("Generating and uploading app icons...");
      const iconBlobs = await generateAndCommitAppIcons({
        owner,
        repo,
        branch,
        fileBuffer: file.buffer,
        accessToken: req.session.githubAccessToken,
      });
      finalTreeNodes.push(...iconBlobs);
    }

    if (finalTreeNodes.length === 0) {
      return res.status(400).json({ message: "No changes were generated." });
    }

    emitLog("Creating commit tree...");
    const newTreeRes = await octokit.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: finalTreeNodes,
    });

    emitLog("Finalizing commit...");
    let autoMsg = [];
    if (cleanAppName) autoMsg.push(`Rename App to ${cleanAppName}`);
    if (file) autoMsg.push(`Update App Icons`);
    const finalCommitMessage =
      commitMessage ||
      autoMsg.join(" & ") + ` - ${new Date().toLocaleString()}`;

    const newCommitRes = await octokit.git.createCommit({
      owner,
      repo,
      message: finalCommitMessage,
      tree: newTreeRes.data.sha,
      parents: [latestCommitSha],
    });

    emitLog("Updating branch reference...");
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommitRes.data.sha,
    });

    emitLog("App settings successfully updated!");
    emitProgress(100, "Done");

    res.json({
      success: true,
      message: "App successfully updated.",
      commitSha: newCommitRes.data.sha,
    });
  } catch (err) {
    next(err);
  }
}

// 6. Get all fork families grouped by parent repo
export async function getForkFamilies(req, res, next) {
  try {
    const accessToken = req.session.githubAccessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "GitHub login required." });
    }

    const octokit = new Octokit({ auth: accessToken });

    // Fetch up to 100 repositories accessible to the user
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    // Filter repos where repo.fork === true
    const forkRepos = repos.filter((r) => r.fork === true);

    if (forkRepos.length === 0) {
      return res.json([]);
    }

    // Fetch full details of each forked repo to resolve parent repository info
    const forkDetails = await Promise.all(
      forkRepos.map(async (fork) => {
        try {
          const { data: detail } = await octokit.repos.get({
            owner: fork.owner.login,
            repo: fork.name,
          });
          return detail;
        } catch (err) {
          console.warn(
            `[fork-families] Failed to fetch details for ${fork.owner.login}/${fork.name}:`,
            err.message,
          );
          return null;
        }
      }),
    );

    const validForks = forkDetails.filter(Boolean);

    // Group forks by parent.full_name
    const groupsMap = {};

    for (const fork of validForks) {
      if (!fork.parent) continue;
      const parentFullName = fork.parent.full_name;

      if (!groupsMap[parentFullName]) {
        groupsMap[parentFullName] = {
          parent: {
            owner: fork.parent.owner.login,
            repo: fork.parent.name,
            fullName: parentFullName,
            defaultBranch: fork.parent.default_branch || "main",
            htmlUrl: fork.parent.html_url,
          },
          forks: [],
        };
      }

      groupsMap[parentFullName].forks.push(fork);
    }

    const results = [];

    // Compare branches and build summaries
    for (const parentFullName of Object.keys(groupsMap)) {
      const group = groupsMap[parentFullName];
      const parent = group.parent;

      const summary = {
        totalForks: group.forks.length,
        same: 0,
        ahead: 0,
        behind: 0,
        diverged: 0,
        unknown: 0,
      };

      const mappedForks = await Promise.all(
        group.forks.map(async (fork) => {
          const forkOwner = fork.owner.login;
          const forkRepo = fork.name;
          const forkBranch = fork.default_branch || "main";
          const parentOwner = parent.owner;
          const parentBranch = parent.defaultBranch;

          let status = "unknown";
          let aheadBy = 0;
          let behindBy = 0;
          let changedFilesCount = 0;

          try {
            // Compare base (parent) with head (fork)
            // basehead format: parentOwner:parentBranch...forkOwner:forkBranch
            const { data: comparison } = await octokit.repos.compareCommits({
              owner: forkOwner,
              repo: forkRepo,
              base: `${parentOwner}:${parentBranch}`,
              head: `${forkOwner}:${forkBranch}`,
            });

            aheadBy = comparison.ahead_by || 0;
            behindBy = comparison.behind_by || 0;
            changedFilesCount = comparison.files ? comparison.files.length : 0;

            if (aheadBy > 0 && behindBy > 0) {
              status = "diverged";
            } else if (aheadBy > 0) {
              status = "ahead";
            } else if (behindBy > 0) {
              status = "behind";
            } else if (aheadBy === 0 && behindBy === 0) {
              status = "same";
            }
          } catch (err) {
            console.warn(
              `[fork-families] Comparison failed for ${forkOwner}/${forkRepo} against parent ${parentOwner}/${parent.repo}:`,
              err.message,
            );
            status = "unknown";
          }

          if (summary[status] !== undefined) {
            summary[status]++;
          } else {
            summary.unknown++;
          }

          return {
            owner: forkOwner,
            repo: forkRepo,
            fullName: fork.full_name,
            branch: forkBranch,
            htmlUrl: fork.html_url,
            status,
            aheadBy,
            behindBy,
            hasUserChanges: aheadBy > 0,
            needsParentUpdate: behindBy > 0,
            changedFilesCount,
          };
        }),
      );

      results.push({
        parent,
        summary,
        forks: mappedForks,
      });
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
}

// 7. Compare a specific parent branch with a fork branch
export async function compareForkBranch(req, res, next) {
  try {
    const {
      parentOwner,
      parentRepo,
      parentBranch,
      forkOwner,
      forkRepo,
      forkBranch,
    } = req.query;
    const accessToken = req.session.githubAccessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "GitHub login required." });
    }

    if (
      !parentOwner ||
      !parentRepo ||
      !parentBranch ||
      !forkOwner ||
      !forkRepo ||
      !forkBranch
    ) {
      return res
        .status(400)
        .json({ message: "Missing comparison parameters." });
    }

    const octokit = new Octokit({ auth: accessToken });
    const { data: comparison } = await octokit.repos.compareCommits({
      owner: forkOwner,
      repo: forkRepo,
      base: `${parentOwner}:${parentBranch}`,
      head: `${forkOwner}:${forkBranch}`,
    });

    const aheadBy = comparison.ahead_by || 0;
    const behindBy = comparison.behind_by || 0;
    const changedFilesCount = comparison.files ? comparison.files.length : 0;

    let status = "unknown";
    if (aheadBy > 0 && behindBy > 0) {
      status = "diverged";
    } else if (aheadBy > 0) {
      status = "ahead";
    } else if (behindBy > 0) {
      status = "behind";
    } else if (aheadBy === 0 && behindBy === 0) {
      status = "same";
    }

    res.json({
      status,
      aheadBy,
      behindBy,
      changedFilesCount,
    });
  } catch (err) {
    next(err);
  }
}

// 8. Merge parent changes into fork branch
export async function mergeForkBranch(req, res, next) {
  try {
    const {
      parentOwner,
      parentRepo,
      parentBranch,
      forkOwner,
      forkRepo,
      forkBranch,
    } = req.body;
    const accessToken = req.session.githubAccessToken;
    if (!accessToken) {
      return res.status(401).json({ message: "GitHub login required." });
    }

    if (
      !parentOwner ||
      !parentRepo ||
      !parentBranch ||
      !forkOwner ||
      !forkRepo ||
      !forkBranch
    ) {
      return res.status(400).json({ message: "Missing merge parameters." });
    }

    const octokit = new Octokit({ auth: accessToken });

    try {
      // 1. Fetch latest commit SHA from parent branch
      const { data: parentBranchData } = await octokit.repos.getBranch({
        owner: parentOwner,
        repo: parentRepo,
        branch: parentBranch,
      });
      const parentCommitSha = parentBranchData.commit.sha;

      // 2. Merge parent commit SHA into fork branch
      const response = await octokit.repos.merge({
        owner: forkOwner,
        repo: forkRepo,
        base: forkBranch,
        head: parentCommitSha,
        commit_message: `Sync: Merge parent ${parentOwner}/${parentRepo}:${parentBranch} (${parentCommitSha}) into ${forkBranch}`,
      });

      res.json({
        success: true,
        message: "Successfully merged parent changes into fork branch.",
        data: response.data,
      });
    } catch (mergeErr) {
      if (mergeErr.status === 409) {
        return res.status(409).json({
          message:
            "Conflict detected during merge. You must resolve conflicts manually on GitHub.",
        });
      }
      if (mergeErr.status === 204) {
        return res.json({
          success: true,
          message: "Branch is already up to date with parent.",
        });
      }
      throw mergeErr;
    }
  } catch (err) {
    next(err);
  }
}

export async function getRepoFile(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { path: filePath, branch } = req.query;

    if (!filePath) {
      return res.status(400).json({ message: "path query parameter is required" });
    }

    const octokit = new Octokit({ auth: req.session.githubAccessToken });

    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branch || "main",
    });

    if (Array.isArray(data)) {
      return res.status(400).json({ message: "path points to a directory, not a file" });
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8");

    res.json({
      content,
      sha: data.sha,
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ message: "File not found" });
    }
    next(err);
  }
}
