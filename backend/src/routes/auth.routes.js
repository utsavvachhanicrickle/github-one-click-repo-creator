import express from 'express';
import { githubLogin, githubCallback, getMe, logoutUser } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/me', getMe);
router.post('/logout', logoutUser);

export default router;
