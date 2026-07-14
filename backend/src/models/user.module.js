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
  },
  findUserByEmail: async ({ email }) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    try {
      const result = await pool.query(query, [email]);
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      return null;
    } catch (error) {
      console.error("[database] PostgreSQL findUserByEmail Error:", error);
      throw error;
    }
  },
  createUser: async ({ unique_id, email, password, name, role = 'personal', user_verified = false, user_verfied }) => {
    const verified = user_verified || user_verfied || false;
    const sql = `
      INSERT INTO users (unique_id, email, password, name, role, user_verified, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const values = [unique_id, email, password, name, role, verified];
    try {
      const res = await pool.query(sql, values);
      return res.rows[0];
    } catch (err) {
      console.error('[database] PostgreSQL createUser Error:', err.message);
      throw err;
    }
  },
  updateLastLogin: async (userId) => {
    const sql = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    try {
      const res = await pool.query(sql, [userId]);
      return res.rows[0];
    } catch (err) {
      console.error('[database] PostgreSQL updateLastLogin Error:', err.message);
      throw err;
    }
  },
};
