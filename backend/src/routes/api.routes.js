import express from 'express';
import authRoutes from './auth.routes.js';
import githubRoutes from './github.routes.js';
import storeRoutes from './store.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/github', githubRoutes);
router.use('/store', storeRoutes);

export default router;
