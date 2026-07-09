# 💻 Client — GitHub One-Click Repo Creator

> **Live URL:** https://github-one-click-repo-creator-b2m9.vercel.app

A modern Single Page Application (SPA) built with React, Vite, Redux Toolkit, and Tailwind CSS v4, allowing developers to authenticate via GitHub and instantly deploy 100% empty blank repositories.

---

## 🚀 Tech Stack

| Package | Purpose |
|---------|---------|
| `react` | UI Component Framework |
| `vite` | Next-generation frontend bundler & dev server |
| `tailwindcss` v4 | Modern styling with CSS variables-first architecture |
| `@reduxjs/toolkit` | Global state management (Auth, Repositories, Toasts) |
| `react-redux` | React bindings for Redux |
| `react-router-dom` | Client-side routing & route protection |
| `lucide-react` | Clean icon assets |

---

## 📁 Project Structure

```
client/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── Logo.jsx        # Premium geometric SVG Logo
│   │   ├── Navbar.jsx      # Navigation bar with Theme & Profile controls
│   │   ├── Toast.jsx       # Global notification banner
│   │   ├── ProtectedRoute.jsx # Auth route wrapper (redirects to /login)
│   │   └── PublicRoute.jsx    # Guest route wrapper (redirects to /dashboard)
│   ├── pages/
│   │   ├── Login.jsx       # Welcome landing page
│   │   └── Dashboard.jsx   # Main workspace (create repo, list history, fetch user repos)
│   ├── store/
│   │   ├── index.js        # Global Redux Store configuration
│   │   └── slices/
│   │       ├── authSlice.js  # Current authenticated user details
│   │       ├── repoSlice.js  # Created history & user repos state
│   │       └── toastSlice.js # Global alert banner state
│   ├── services/
│   │   └── api.js          # Fetch HTTP API endpoints client
│   ├── App.jsx             # App layout structure & Route Switcher
│   ├── main.jsx            # React root mount point & provider wrappers
│   └── index.css           # Tailwind configuration & global CSS variable theme
├── .env                    # Local development variables (gitignored)
├── .env.production         # Production variables (gitignored)
├── vercel.json             # Vercel deployment redirect configuration
├── vite.config.js          # Vite plugin configuration
└── package.json
```

---

## 🛠️ Local Development Setup

### 1. Install dependencies
```bash
cd client
npm install
```

### 2. Configure Local Environment
Create a `.env` file in the `client` directory:
```env
VITE_API_BASE_URL=http://localhost:4000
```

### 3. Run the Development Server
```bash
npm run dev
# App will run at: http://localhost:5173
```

---

## 🎨 Theme & Styling System
The application utilizes Tailwind CSS v4's native CSS variable support. Custom theme variables are defined in [src/index.css](file:///d:/utsav/github-one-click-repo-creator/client/src/index.css):

*   **Primary Palette:** Indigo (`--primary`)
*   **Accent Palette:** Purple (`--accent`)
*   **Aesthetics:** Smooth gradients, custom glassmorphism, responsive grid layouts, and support for light/dark themes.

All styles bind using parenthesis notation: e.g. `bg-(--bg)`, `text-(--text-primary)`, `border-(--border)`.

---

## ☁️ Vercel Deployment

1. Create a new Vercel project and link it to the repository.
2. Set the **Root Directory** to `client`.
3. Set the **Build Command** to `npm run build`.
4. Add the following production environment variable:
   *   `VITE_API_BASE_URL` = `https://github-one-click-repo-creator.vercel.app`
5. Deploy — live at: https://github-one-click-repo-creator-b2m9.vercel.app

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Launch Vite local dev server with HMR |
| `npm run build` | Bundle React client for production build |
| `npm run preview` | Serve the locally generated production bundle |
| `npm run lint` | Run ESLint to review code syntax warnings |
