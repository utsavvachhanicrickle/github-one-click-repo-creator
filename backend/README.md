# 🔧 Backend — GitHub One-Click Repo Creator

> **Live URL:** https://github-one-click-repo-creator.vercel.app

Node.js + Express REST API server powering the GitHub One-Click Repo Creator. Handles GitHub OAuth authentication, blank repository creation via the GitHub API, and session management backed by MongoDB Atlas.

---

## 🚀 Tech Stack

| Package | Purpose |
|---------|---------|
| `express` | HTTP server & routing |
| `@octokit/rest` | GitHub REST API client |
| `mongoose` | MongoDB ODM |
| `express-session` + `connect-mongo` | Persistent session store in MongoDB |
| `helmet` | Security headers |
| `cors` | Cross-origin request handling |
| `zod` | Request body schema validation |
| `axios` | HTTP client for GitHub OAuth token exchange |
| `dotenv` | Environment variable loading |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.js                      # Express app entry point + export
│   ├── config.js                      # Environment config loader
│   ├── db.js                          # MongoDB connection with serverless caching
│   ├── routes/
│   │   ├── api.routes.js              # Top-level router (/api)
│   │   ├── auth.routes.js             # GitHub OAuth routes
│   │   └── github.routes.js           # Repository routes (all protected)
│   ├── controllers/
│   │   ├── auth.controller.js         # Login, callback, getMe, logout
│   │   └── github.controller.js       # Create repo, list repos
│   ├── middleware/
│   │   ├── auth.middleware.js         # requireGithubLogin session guard
│   │   └── error.middleware.js        # Global error handler
│   ├── models/
│   │   ├── User.js                    # GitHub user schema
│   │   └── Repository.js             # Created repository record schema
│   └── services/
│       ├── githubRepo.service.js      # Octokit blank repo creation
│       ├── starterTemplate.service.js # File template generator (returns [])
│       └── n8n.service.js            # n8n webhook integration for repo listing
├── .env                   # Local development variables (gitignored)
├── .env.production        # Production variables (gitignored)
├── vercel.json            # Vercel deployment config
└── package.json
```

---

## ⚙️ API Routes

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check — always returns `{ ok: true }` |
| `GET` | `/api/auth/github` | Redirect to GitHub OAuth page |
| `GET` | `/api/auth/github/callback` | OAuth callback — saves user, creates session |
| `GET` | `/api/auth/me` | Returns current session user or 401 |
| `POST` | `/api/auth/logout` | Destroys session, clears cookie |

### Protected Routes — require GitHub login

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/github/create-website-repo` | Create a 100% blank GitHub repository |
| `GET` | `/api/github/my-repositories` | Repos created through this app (MongoDB) |
| `GET` | `/api/github/user-repositories` | All user repos via n8n webhook |

---

## 🛠️ Local Development Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Copy environment file
```bash
cp .env.example .env
```

### 3. Create GitHub OAuth App
1. Go to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**
2. **Homepage URL:** `http://localhost:5173`
3. **Authorization callback URL:** `http://localhost:4000/api/auth/github/callback`
4. Copy **Client ID** and **Client Secret** into `.env`

### 4. Start MongoDB locally
```bash
# Using mongosh or just have MongoDB installed and running
mongod
```

### 5. Run the server
```bash
npm run dev
# Server: http://localhost:4000
```

---

## 🔐 Environment Variables

| Variable | Local Value | Production Value |
|----------|-------------|-----------------|
| `GITHUB_CLIENT_ID` | from OAuth App | from OAuth App |
| `GITHUB_CLIENT_SECRET` | from OAuth App | from OAuth App |
| `GITHUB_CALLBACK_URL` | `http://localhost:4000/api/auth/github/callback` | `https://github-one-click-repo-creator.vercel.app/api/auth/github/callback` |
| `GITHUB_OAUTH_SCOPES` | `repo read:user user:email` | same |
| `FRONTEND_URL` | `http://localhost:5173` | `https://github-one-click-repo-creator-b2m9.vercel.app` |
| `BACKEND_URL` | `http://localhost:4000` | `https://github-one-click-repo-creator.vercel.app` |
| `SESSION_SECRET` | any long random string | strong 128-char hex |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/github-repo-creator` | Atlas `mongodb+srv://...` URI |
| `N8N_GET_REPOSITORIES_WEBHOOK_URL` | `http://localhost:5678/webhook/get-user-repos` | public n8n URL |
| `NODE_ENV` | *(unset)* | `production` |

---

## ☁️ Vercel Deployment

1. Create a new Vercel project → set **Root Directory** to `backend`
2. Add all env vars from `.env.production` into **Vercel → Settings → Environment Variables**
3. Update your **GitHub OAuth App** callback URL to the Vercel backend URL
4. In **MongoDB Atlas → Network Access** → add `0.0.0.0/0` (required for Vercel dynamic IPs)
5. Deploy — live at: https://github-one-click-repo-creator.vercel.app

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm start` | Start production server |
