import { z } from 'zod';
import { Octokit } from '@octokit/rest';
import { createStarterWebsiteFiles } from '../services/starterTemplate.service.js';
import { getRepositoriesFromN8n } from '../services/n8n.service.js';
import { createRepoWithFiles } from '../services/githubRepo.service.js';
import { User } from '../models/User.js';
import { Repository } from '../models/Repository.js';

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

    // Save created repository information in MongoDB
    const dbUser = await User.findOne({ githubId: user.id });
    if (dbUser) {
      await Repository.create({
        userId: dbUser._id,
        repoName: input.repoName,
        description: input.description,
        isPrivate: input.isPrivate,
        htmlUrl: result.htmlUrl,
        cloneUrl: result.cloneUrl
      });
      console.log(`[database] Saved new repository metadata to MongoDB: ${user.login}/${input.repoName}`);
    } else {
      console.warn(`[database] User ${user.login} not found, skipped saving repository metadata.`);
    }

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

export async function getMyRepositories(req, res, next) {
  try {
    const user = req.session.githubUser;
    const dbUser = await User.findOne({ githubId: user.id });
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found in database.' });
    }
    const repos = await Repository.find({ userId: dbUser._id }).sort({ createdAt: -1 });
    console.log(`[database] Fetched ${repos.length} app-created repositories for user: ${user.login}`);
    res.json(repos);
  } catch (err) {
    next(err);
  }
}

export async function getUserRepositories(req, res, next) {
  try {
    const n8nRepos = await getRepositoriesFromN8n(
      req.session.githubAccessToken,
      req.session.githubUser?.login
    );

    if (n8nRepos !== null) {
      console.log(`[n8n] Successfully fetched user repositories via n8n webhook for: ${req.session.githubUser?.login}`);
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
