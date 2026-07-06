function safeJson(value) {
  return JSON.stringify(value, null, 2);
}

export function createStarterWebsiteFiles({ repoName, username }) {
  const displayName = repoName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return [
    {
      path: 'package.json',
      content: safeJson({
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          '@vitejs/plugin-react': 'latest',
          vite: 'latest',
          react: 'latest',
          'react-dom': 'latest'
        },
        devDependencies: {}
      }) + '\n'
    },
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${displayName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
    },
    {
      path: 'src/main.jsx',
      content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './style.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    },
    {
      path: 'src/App.jsx',
      content: `export default function App() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Created from your website builder</p>
        <h1>${displayName}</h1>
        <p className="subtitle">
          This repository was automatically created in @${username}'s GitHub account.
        </p>
        <a className="button" href="https://github.com/${username}/${repoName}" target="_blank">
          View Repository
        </a>
      </section>
    </main>
  );
}
`
    },
    {
      path: 'src/style.css',
      content: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #0f172a;
  color: white;
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px;
}

.hero {
  width: min(920px, 100%);
  padding: 72px 40px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 32px;
  background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(14,165,233,0.18));
  box-shadow: 0 30px 100px rgba(0,0,0,0.35);
  text-align: center;
}

.eyebrow {
  margin: 0 0 16px;
  color: #93c5fd;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 13px;
  font-weight: 700;
}

h1 {
  margin: 0;
  font-size: clamp(42px, 8vw, 92px);
  line-height: 0.95;
}

.subtitle {
  margin: 28px auto 0;
  max-width: 650px;
  color: #cbd5e1;
  font-size: 20px;
  line-height: 1.6;
}

.button {
  display: inline-flex;
  margin-top: 36px;
  padding: 14px 22px;
  border-radius: 999px;
  background: white;
  color: #0f172a;
  text-decoration: none;
  font-weight: 800;
}
`
    },
    {
      path: '.gitignore',
      content: `node_modules
dist
.env
.DS_Store
`
    },
    {
      path: 'README.md',
      content: `# ${displayName}

This website repo was created automatically from the repo creator web app.

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Created for GitHub user: @${username}
`
    }
  ];
}

export function mergeFiles(baseFiles, overrideFiles = []) {
  const map = new Map(baseFiles.map((file) => [file.path, file]));

  for (const file of overrideFiles) {
    if (!file?.path || typeof file.content !== 'string') continue;
    map.set(file.path, { path: file.path, content: file.content });
  }

  return Array.from(map.values());
}
