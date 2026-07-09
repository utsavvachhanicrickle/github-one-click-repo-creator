# GitHub One-Click Repo Creator

This application allows visitors to log in using GitHub, authorize repository permissions, and deploy a fully configured React + Vite template repository directly inside their own GitHub profile with one click.

---

## Architecture

* **Frontend (Vite + React + Tailwind CSS)**: Located in the `client/` folder.
* **Backend (Node.js + Express + MongoDB)**: Located in the `backend/` folder.
* **Database (MongoDB)**: Used to store user profiles, session cookies (via `connect-mongo`), and created repository logs.

---

## Setup & Running the Application

Since the frontend and backend are independent projects, you must run them separately in two terminal windows:

### 1. Set Up the Backend
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Fill in the `.env` variables (see the guide below to retrieve them).
5. Start the backend:
   ```bash
   npm run dev
   ```
   *(Running on http://localhost:4000)*

### 2. Set Up the Frontend (Client)
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Start the frontend client:
   ```bash
   npm run dev
   ```
   *(Running on http://localhost:5173)*

---

## How to Retrieve Configuration Parameters

### 1. GitHub OAuth App Credentials
To authenticate users and write repositories on their behalf:
1. Go to your **GitHub Settings** > **Developer settings** > **OAuth Apps** > **New OAuth App**.
   * *Note: If using a **GitHub App**, ensure you go to **Permissions & events** and set **Administration** and **Repository Contents** permissions to **Read & Write**.*
2. Set the following details:
   * **Homepage URL**: `http://localhost:5173`
   * **Authorization callback URL**: `http://localhost:4000/api/auth/github/callback`
3. Click **Register application**.
4. Generate and copy the **Client ID** and **Client Secret**.
5. Put them in `backend/.env`:
   ```env
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

### 2. MongoDB Database URI
You need a running MongoDB database.
* By default, it connects to a local instance: `mongodb://127.0.0.1:27017/github-repo-creator`.
* Ensure your local MongoDB server is running, or set `MONGODB_URI` to a MongoDB Atlas cluster string.

### 3. n8n Webhooks Setup
If you want to customize files using n8n or trigger flows on user login:
1. Open your n8n dashboard and click **Import from File...**.
2. Upload the template JSON from **[docs/n8n-workflow-import.json](docs/n8n-workflow-import.json)**.
3. Save the workflow and switch the toggle in the top-right to **Active / ON**.
4. Double-click the **Webhook - Custom Files** node and copy the webhook URL. Put it in `backend/.env` under `N8N_CREATE_WEBSITE_WEBHOOK_URL`.
5. Double-click the **Webhook - User Login** node and copy the webhook URL. Put it in `backend/.env` under `N8N_LOGIN_WEBHOOK_URL`.
