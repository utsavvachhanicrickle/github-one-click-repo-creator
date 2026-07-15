import express from 'express';
import { authenticateUser, requireGithubLogin } from '../middleware/auth.middleware.js';
import { createStoreRepoController, getStoreRepoController } from '../controllers/store.controller.js';

const router = express.Router();

router.use(authenticateUser);
router.use(requireGithubLogin);

router.post('/create-store-repo', createStoreRepoController);
router.post('/get-store-repo', getStoreRepoController);

export default router;
