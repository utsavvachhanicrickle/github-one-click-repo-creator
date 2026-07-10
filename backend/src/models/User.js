import { pool } from '../db.js';

export const User = {
  findOneAndUpdate: async (query, update) => {
    const sql = `
      INSERT INTO users (github_id, login, avatar_url, html_url, name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (github_id)
      DO UPDATE SET
        login = EXCLUDED.login,
        avatar_url = EXCLUDED.avatar_url,
        html_url = EXCLUDED.html_url,
        name = EXCLUDED.name
      RETURNING *;
    `;
    const values = [
      query.githubId,
      update.login,
      update.avatarUrl,
      update.htmlUrl,
      update.name
    ];
    try {
      const res = await pool.query(sql, values);
      return res.rows[0];
    } catch (err) {
      console.error('[database] PostgreSQL User Upsert Error:', err.message);
      throw err;
    }
  }
};
