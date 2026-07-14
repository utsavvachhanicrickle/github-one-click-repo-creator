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

    // 2. Detect and migrate old users table structure if needed
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='unique_id';
    `);
    if (checkColumn.rows.length === 0) {
      console.log('[database] Migrating users table to support email/password credentials and roles.');
      await pool.query('DROP TABLE IF EXISTS "users" CASCADE;');
    }

    // 3. Create github credentials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "github" (
        "id" SERIAL PRIMARY KEY,
        "github_id" BIGINT UNIQUE NOT NULL,
        "access_token" VARCHAR(255) NOT NULL,
        "login" VARCHAR(100) NOT NULL,
        "avatar_url" VARCHAR(255),
        "html_url" VARCHAR(255),
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "unique_id" VARCHAR(10) UNIQUE NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "role" VARCHAR(20) NOT NULL DEFAULT 'personal',
        "github" INTEGER REFERENCES "github"("id") ON DELETE SET NULL,
        "user_verified" BOOLEAN DEFAULT FALSE,
        "last_login" TIMESTAMP DEFAULT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);


    // 5. Create otp verification codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "otp" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255),
        "user_unique_id" VARCHAR(50),
        "otp_code" VARCHAR(6) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[database] Database DDL verification & table seeding completed.');
  } catch (error) {
    console.error(`[database] PostgreSQL Connection or DDL Error: ${error.message}`);
    process.exit(1);
  }
}
