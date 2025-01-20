import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10
});

export const db = drizzle(pool, { schema });

// Initialize database connection
async function initDb() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database initialized successfully:', result.rows[0].now);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

initDb().catch(console.error);

// Handle process termination
process.on('exit', async () => {
  console.log('Database connection closing...');
  await pool.end();
});