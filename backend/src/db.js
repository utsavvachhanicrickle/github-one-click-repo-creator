import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/github_automation';

export const pool = new pg.Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function connectDB() {
  try {
    const client = await pool.connect();
    console.log(`[database] PostgreSQL Connected successfully to database: ${client.database}`);
    client.release();

    // DDL Initialization
    // 1. Create session table required by connect-pg-simple
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      ) WITH (OIDS=FALSE);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    // 2. Create users table for profile mapping
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "github_id" BIGINT UNIQUE NOT NULL,
        "login" VARCHAR(100) NOT NULL,
        "avatar_url" VARCHAR(255),
        "html_url" VARCHAR(255),
        "name" VARCHAR(100),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[database] Database DDL verification & table seeding completed.');
  } catch (error) {
    console.error(`[database] PostgreSQL Connection or DDL Error: ${error.message}`);
    process.exit(1);
  }
}
