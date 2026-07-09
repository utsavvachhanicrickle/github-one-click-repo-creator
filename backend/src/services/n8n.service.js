import axios from 'axios';
import { config } from '../config.js';


export async function getRepositoriesFromN8n(accessToken, username) {
  if (!config.n8n.getRepositoriesWebhookUrl) return null;

  try {
    const { data } = await axios.post(config.n8n.getRepositoriesWebhookUrl, {
      accessToken,
      username
    }, {
      timeout: 45_000,
      headers: { 'Content-Type': 'application/json' }
    });

    const repos = Array.isArray(data) ? data : data?.repositories;
    if (!Array.isArray(repos)) return null;

    return repos.map((r) => ({
      name: r.name,
      owner: r.owner?.login || r.owner || username,
      isPrivate: r.private !== undefined ? r.private : (r.isPrivate !== undefined ? r.isPrivate : r.private),
      defaultBranch: r.default_branch || r.defaultBranch || 'main',
      updatedAt: r.updated_at || r.updatedAt,
      language: r.language || null,
      htmlUrl: r.html_url || r.htmlUrl
    }));
  } catch (error) {
    console.warn('[n8n] Get Repositories webhook failed:', error.message);
    return null;
  }
}

