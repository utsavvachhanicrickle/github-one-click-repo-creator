# Reorganization, Dark Mode & Blank Repository Plan

This plan outlines the code restructures, addition of the Blank Repository template, and integrating a toggleable Dark Mode theme using React Context, selector-based Tailwind v4 configuration, and using exclusively Lucide icons.

## User Review Required

> [!IMPORTANT]
> The backend file layout will be updated to introduce controllers, middleware, and a unified api router.
> The frontend API file `api.js` will be moved to `client/src/services/api.js`.
> A toggleable Dark Mode theme will be integrated.
> Exclusively **Lucide React** icons will be used for all visual cues.

---

## Proposed Changes

### Backend Reorganization & Feature

#### [NEW] [backend/src/routes/api.routes.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/routes/api.routes.js)
- Unified router that mounts `/auth` and `/github` routes.

#### [NEW] [backend/src/controllers/auth.controller.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/controllers/auth.controller.js)
- Contains logic for GitHub OAuth login, callback, `/me`, and logout.

#### [NEW] [backend/src/controllers/github.controller.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/controllers/github.controller.js)
- Contains logic for creating repositories (Blank vs. Vite React) and listing them.

#### [NEW] [backend/src/middleware/auth.middleware.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/middleware/auth.middleware.js)
- Contains `requireGithubLogin` check middleware.

#### [NEW] [backend/src/middleware/error.middleware.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/middleware/error.middleware.js)
- Contains central Express error logging and response middleware.

#### [MODIFY] [backend/src/routes/auth.routes.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/routes/auth.routes.js)
- Connects route paths to the handlers inside `auth.controller.js`.

#### [MODIFY] [backend/src/routes/github.routes.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/routes/github.routes.js)
- Connects route paths to the handlers inside `github.controller.js`.

#### [MODIFY] [backend/src/server.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/server.js)
- Update routes registration to use `app.use('/api', apiRoutes)`.
- Use the central error middleware.

#### [MODIFY] [backend/src/services/starterTemplate.service.js](file:///d:/utsav/github-one-click-repo-creator/backend/src/services/starterTemplate.service.js)
- Implement `createBlankRepoFiles({ repoName, username, description })` to return a simple `.gitignore` and `README.md` file array.

---

### Frontend Reorganization & Features

#### [DELETE] [client/src/api.js](file:///d:/utsav/github-one-click-repo-creator/client/src/api.js)
- Remove `api.js` from root src directory.

#### [NEW] [client/src/services/api.js](file:///d:/utsav/github-one-click-repo-creator/client/src/services/api.js)
- Move API helper functions to this location.

#### [NEW] [client/src/context/darkModeContext.jsx](file:///d:/utsav/github-one-click-repo-creator/client/src/context/darkModeContext.jsx)
- Implement `DarkModeContextProvider` managing local storage state and the `data-theme` HTML attribute.

#### [MODIFY] [client/src/main.jsx](file:///d:/utsav/github-one-click-repo-creator/client/src/main.jsx)
- Wrap `<App />` inside `<DarkModeContextProvider>`.

#### [MODIFY] [client/src/index.css](file:///d:/utsav/github-one-click-repo-creator/client/src/index.css)
- Define the custom Tailwind v4 `@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` rule.

#### [MODIFY] [client/src/App.jsx](file:///d:/utsav/github-one-click-repo-creator/client/src/App.jsx)
- Add dropdown for template type select: `Vite React Template` or `Blank Repository`.
- Consume `DarkModeContext` and display a theme toggle switch (Sun / Moon) in the navbar.
- Apply light/dark variant classes across the layout structure.
- Ensure all icons used are exclusively Lucide React icons.

---

## Verification Plan

### Manual Verification
1. Open frontend and backend development environments.
2. Toggle theme between light and dark; verify colors adapt smoothly.
3. Test creating a **Blank Repository** and a **Vite React Template** repository.
4. Verify repository history updates and toast indicators behave as expected under both themes.
