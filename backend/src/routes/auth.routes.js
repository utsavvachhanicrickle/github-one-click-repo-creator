import express from 'express';
import { githubLogin, githubCallback, getMe, logoutUser, loginController, registerUserController } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);
router.get('/me', authenticateUser, getMe);
router.post('/logout', logoutUser);

router.post("/login", loginController);
router.post("/register-user", registerUserController);

export default router;
