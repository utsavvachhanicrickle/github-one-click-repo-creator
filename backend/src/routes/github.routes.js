import express from 'express';
import multer from 'multer';
import { requireGithubLogin } from '../middleware/auth.middleware.js';
import {
  createWebsiteRepo,
  getMyRepositories,
  getUserRepositories,
  getUserRepos,
  getRepoBranches,
  createBranch,
  compareUpload,
  commitUpload
} from '../controllers/github.controller.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  }
});

router.post('/create-website-repo', requireGithubLogin, createWebsiteRepo);
router.get('/my-repositories', requireGithubLogin, getMyRepositories);
router.get('/user-repositories', requireGithubLogin, getUserRepositories);

// Active repo detail & commit workflow routes
router.get('/repos', requireGithubLogin, getUserRepos);
router.get('/repos/:owner/:repo/branches', requireGithubLogin, getRepoBranches);
router.post('/repos/:owner/:repo/branches', requireGithubLogin, createBranch);
router.post('/repos/:owner/:repo/compare-upload', requireGithubLogin, upload.any(), compareUpload);
router.post('/repos/:owner/:repo/commit-upload', requireGithubLogin, upload.any(), commitUpload);

export default router;
