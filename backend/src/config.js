import dotenv from "dotenv";

dotenv.config();

const required = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GITHUB_CALLBACK_URL",
  "SESSION_SECRET",
];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[config] Missing ${key}. Add it to backend/.env`);
  }
}

const GITHUB_API_URL = "https://api.github.com";

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  backendUrl: process.env.BACKEND_URL || "http://localhost:4000",
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl:
      process.env.GITHUB_CALLBACK_URL ||
      "http://localhost:4000/api/auth/github/callback",
    scopes: process.env.GITHUB_OAUTH_SCOPES || "repo read:user user:email",
  },
  sessionSecret: process.env.SESSION_SECRET || "dev-only-change-this",
  bcryptSalt: Number(process.env.BCRYPT || 10),
  jwtSecret: process.env.JWT_SECRET || "jwt-access-secret",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "jwt-refresh-secret",
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || process.env.EMAIL_ID || "",
    pass: process.env.SMTP_PASS || process.env.EMAIL_SCRETE || "",
  },
  n8n: {
    getRepositoriesWebhookUrl:
      process.env.N8N_GET_REPOSITORIES_WEBHOOK_URL || "",
  },
  githubAcctionToken: process.env.GITHUB_ACCESS_TOKEN || "",
  githubApiUrl: GITHUB_API_URL,
};

export function getHeaders() {
  const token = config.githubAcctionToken;
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}
