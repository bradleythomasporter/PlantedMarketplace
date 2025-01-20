import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@db/schema";

// Create a basic connection pool using individual connection parameters
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
});

// Test database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  client.query('SELECT NOW() as now', (err, res) => {
    done(); // Release the client back to the pool
    if (err) {
      console.error('Error executing test query:', err.stack);
      return;
    }
    console.log('Database connected successfully:', res.rows[0].now);
  });
});

export const db = drizzle(pool, { schema });