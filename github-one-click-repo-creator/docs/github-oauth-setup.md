# GitHub OAuth Setup

Use OAuth App for this beginner-friendly flow.

## OAuth app settings

```txt
Homepage URL:
http://localhost:5173

Authorization callback URL:
http://localhost:4000/api/auth/github/callback
```

## Scopes

Use this when private repo creation is required:

```txt
repo read:user user:email
```

Use this when only public repo creation is required:

```txt
public_repo read:user user:email
```

## Environment

```env
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:4000/api/auth/github/callback
GITHUB_OAUTH_SCOPES=repo read:user user:email
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=change_me
```
