import { pool } from '../db.js';

export const Otp = {
  create: async ({ user_unique_id, email, otp_code, expires_at }) => {
    // If expires_at is passed as a timestamp number, convert to a standard Date object
    const expiryDate = new Date(expires_at);
    const sql = `
      INSERT INTO otp (user_unique_id, email, otp_code, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [user_unique_id || null, email || null, otp_code, expiryDate];
    try {
      const res = await pool.query(sql, values);
      return res.rows[0];
    } catch (err) {
      console.error('[database] PostgreSQL Otp.create Error:', err.message);
      throw err;
    }
  }
};
