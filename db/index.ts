import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Initialize database connection
async function initDb() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('Database initialized successfully:', result[0].now);
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

initDb().catch(console.error);

// Handle process termination.
process.on('exit', () => {
  console.log('Database connection closing...');
});