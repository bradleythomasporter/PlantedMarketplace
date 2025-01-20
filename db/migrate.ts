import Database from 'better-sqlite3';
import path from 'path';

// Create database connection
const db = new Database('sqlite.db');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('customer', 'nursery')),
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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  scientific_name TEXT,
  category TEXT NOT NULL CHECK(category IN ('indoor', 'outdoor', 'trees', 'shrubs', 'flowers')),
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  nursery_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  sun_exposure TEXT,
  watering_needs TEXT,
  height TEXT,
  spread TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nursery_id) REFERENCES users(id)
);

-- Add some test data
INSERT OR IGNORE INTO users (username, password, role, name, email, created_at, updated_at)
VALUES ('test_nursery', 'password123', 'nursery', 'Test Nursery', 'test@example.com', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add some test plants
INSERT OR IGNORE INTO plants (
  name, category, description, price, nursery_id, quantity, created_at, updated_at
)
VALUES 
  ('Peace Lily', 'indoor', 'Beautiful indoor plant', 29.99, 1, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Rose Bush', 'outdoor', 'Classic garden rose', 19.99, 1, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Maple Tree', 'trees', 'Decorative maple tree', 49.99, 1, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
`);

console.log('Database and tables created successfully');
