import express from 'express';
import { requireGithubLogin } from '../middleware/auth.middleware.js';
import { createWebsiteRepo, getMyRepositories, getUserRepositories } from '../controllers/github.controller.js';

const router = express.Router();

router.post('/create-website-repo', requireGithubLogin, createWebsiteRepo);
router.get('/my-repositories', requireGithubLogin, getMyRepositories);
router.get('/user-repositories', requireGithubLogin, getUserRepositories);

export default router;
