import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@db/schema";
import path from 'path';

// Create database connection with the correct path
const dbPath = path.join(process.cwd(), 'sqlite.db');
const sqlite = new Database(dbPath);

// Configure the database
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Create drizzle database instance
export const db = drizzle(sqlite, { schema });

// Test connection
try {
  const result = sqlite.prepare('SELECT 1 + 1 as test').get();
  console.log('Connected to SQLite database at:', dbPath);
  console.log('Test query result:', result.test);
} catch (error) {
  console.error('Database connection failed:', error);
  process.exit(1);
}
