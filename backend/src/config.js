import dotenv from 'dotenv';

dotenv.config();

const required = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_CALLBACK_URL', 'SESSION_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[config] Missing ${key}. Add it to backend/.env`);
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4000',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback',
    scopes: process.env.GITHUB_OAUTH_SCOPES || 'repo read:user user:email'
  },
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-change-this',
  n8n: {
    getRepositoriesWebhookUrl: process.env.N8N_GET_REPOSITORIES_WEBHOOK_URL || ''
  }
};
