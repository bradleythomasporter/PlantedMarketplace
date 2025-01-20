import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@db/schema";
import path from 'path';
import { sql } from 'drizzle-orm';

// Create database connection with the correct path
const dbPath = path.join(process.cwd(), 'sqlite.db');
const sqlite = new Database(dbPath);

// Configure the database
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

// Create drizzle database instance
export const db = drizzle(sqlite, { schema });

// Initialize tables
const initDb = async () => {
  try {
    // Create tables if they don't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT NOT NULL CHECK (role IN ('customer', 'nursery')),
        name TEXT NOT NULL,
        address TEXT,
        phone_number TEXT,
        description TEXT,
        hours_of_operation TEXT,
        website TEXT,
        latitude REAL,
        longitude REAL,
        service_radius REAL,
        business_license TEXT,
        rating REAL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS plants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        scientific_name TEXT,
        category TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        nursery_id INTEGER NOT NULL REFERENCES users(id),
        quantity INTEGER NOT NULL DEFAULT 0,
        sun_exposure TEXT,
        watering_needs TEXT,
        height TEXT,
        spread TEXT,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES users(id),
        nursery_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount REAL NOT NULL,
        shipping_address TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        plant_id INTEGER NOT NULL REFERENCES plants(id),
        quantity INTEGER NOT NULL,
        price_at_time REAL NOT NULL,
        requires_planting INTEGER NOT NULL DEFAULT 0
      );
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    process.exit(1);
  }
};

// Initialize tables
initDb().catch(console.error);

// Test connection
try {
  const result = sqlite.prepare('SELECT 1 + 1 as test').get();
  console.log('Connected to SQLite database at:', dbPath);
  console.log('Test query result:', result.test);
} catch (error) {
  console.error('Database connection failed:', error);
  process.exit(1);
}

export { sql };