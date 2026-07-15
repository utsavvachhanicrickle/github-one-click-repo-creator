import { pool } from "../db.js";

export const User = {
  upsertGithubCredentials: async ({
    github_id,
    user_id,
    access_token,
    login,
    avatar_url,
    html_url,
  }) => {
    const sql = `
      INSERT INTO github (github_id, user_id, access_token, login, avatar_url, html_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (github_id)
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        access_token = EXCLUDED.access_token,
        login = EXCLUDED.login,
        avatar_url = EXCLUDED.avatar_url,
        html_url = EXCLUDED.html_url
      RETURNING *;
    `;
    const values = [
      github_id,
      user_id,
      access_token,
      login,
      avatar_url,
      html_url,
    ];
    try {
      const res = await pool.query(sql, values);
      return res.rows[0];
    } catch (err) {
      console.error(
        "[database] PostgreSQL upsertGithubCredentials Error:",
        err.message,
      );
      throw err;
    }
  },
  findUserByEmail: async ({ email }) => {
    const query = `SELECT 
    u.*, g.github_id as github_id, g.login as github_login, g.avatar_url as github_avatar_url  
    FROM users u 
    LEFT JOIN github g 
    on g.user_id = u.id 
    WHERE u.email = $1`;
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
  findUserById: async ({ id }) => {
    const ids = Array.isArray(id) ? id : [id];

    const query = `SELECT 
    u.*, g.github_id as github_id, g.login as github_login, g.avatar_url as github_avatar_url  
    FROM users u 
    LEFT JOIN github g 
    on g.user_id = u.id 
    WHERE u.id = ANY($1)`;
    // const query = `SELECT * FROM users WHERE id = ANY($1)`;
    try {
      const result = await pool.query(query, [ids]);
      if (result.rows.length > 0) {
        return Array.isArray(id) ? result.rows : result.rows[0];
      }
      return Array.isArray(id) ? [] : null;
    } catch (error) {
      console.error("[database] PostgreSQL findUserById Error:", error);
      throw error;
    }
  },
  createUser: async ({
    unique_id,
    email,
    password,
    name,
    role = "personal",
    user_verified = false,
    user_verfied,
  }) => {
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
      console.error("[database] PostgreSQL createUser Error:", err.message);
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
      console.error(
        "[database] PostgreSQL updateLastLogin Error:",
        err.message,
      );
      throw err;
    }
  },
  addAdminPersonalRelation: async ({ adminid, personalid }) => {
    const sql = `
      INSERT INTO adminpersonalrelation (adminid, personalid)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [adminid, personalid];
    try {
      const res = await pool.query(sql, values);
      return res.rows[0];
    } catch (err) {
      console.error(
        "[database] PostgreSQL addAdminPersonalRelation Error:",
        err.message,
      );
      throw err;
    }
  },
  getAdminPersonalUserByAdminId: async ({ admin_id }) => {
    const sql = `
      SELECT id, personalid FROM adminpersonalrelation WHERE adminid = $1
    `;
    const values = [admin_id];
    try {
      const res = await pool.query(sql, values);
      return res.rows;
    } catch (err) {
      console.error(
        "[database] PostgreSQL getAdminPersonalUserByAdminId Error:",
        err.message,
      );
      throw err;
    }
  },
  getAdminPersonalUserByPersonalId: async ({ personal_id }) => {
    const sql = `SELECT adminid FROM adminpersonalrelation WHERE personalid = $1`;
    const values = [personal_id];
    try {
      const res = await pool.query(sql, values);
      return res.rows;
    } catch (err) {
      console.error(
        "[database] PostgreSQL getAdminPersonalUserByPersonalId Error:",
        err.message,
      );
      throw err;
    }
  },
};
