import express from 'express';
import multer from 'multer';
import { requireGithubLogin, authenticateUser } from '../middleware/auth.middleware.js';
import {
  createWebsiteRepo,
  getUserRepos,
  getRepoBranches,
  createBranch,
  compareUpload,
  commitUpload,
  renameRemoteFlutterApp,
  getForkFamilies,
  compareForkBranch,
  mergeForkBranch
} from '../controllers/github.controller.js';

const router = express.Router();

router.use(authenticateUser);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  }
});

router.post('/create-website-repo', requireGithubLogin, createWebsiteRepo);
router.get('/user-repositories', requireGithubLogin, getUserRepos);
router.get('/fork-families', requireGithubLogin, getForkFamilies);
router.get('/fork-families/compare', requireGithubLogin, compareForkBranch);
router.post('/fork-families/merge', requireGithubLogin, mergeForkBranch);

// Active repo detail & commit workflow routes
router.get('/repos', requireGithubLogin, getUserRepos);
router.get('/repos/:owner/:repo/branches', requireGithubLogin, getRepoBranches);
router.post('/repos/:owner/:repo/branches', requireGithubLogin, createBranch);
router.post('/repos/:owner/:repo/compare-upload', requireGithubLogin, upload.any(), compareUpload);
router.post('/repos/:owner/:repo/commit-upload', requireGithubLogin, upload.any(), commitUpload);
router.post('/repos/:owner/:repo/rename-remote-flutter', requireGithubLogin, renameRemoteFlutterApp);

export default router;
