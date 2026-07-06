import express from 'express';
import authRoutes from './auth.routes.js';
import githubRoutes from './github.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/github', githubRoutes);

export default router;
