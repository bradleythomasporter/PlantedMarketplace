import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@db/schema";

// Verify required environment variables
const requiredEnvVars = ['PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGPORT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Create the connection pool with individual parameters
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: Number(process.env.PGPORT),
});

export const db = drizzle(pool, { schema });

// Test the connection and log database status
pool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
    throw err;
  } else {
    console.log('Database connection established successfully');
    // Test a simple query
    client.query('SELECT NOW()', (queryErr, result) => {
      done(); // Release the client back to the pool
      if (queryErr) {
        console.error('Error executing test query:', queryErr.message);
      } else {
        console.log('Database is responsive. Server time:', result.rows[0].now);
      }
    });
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message);
  process.exit(-1);
});