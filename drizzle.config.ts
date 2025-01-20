import { defineConfig } from "drizzle-kit";

if (!process.env.PGDATABASE || !process.env.PGHOST) {
  throw new Error("Database configuration environment variables must be set");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: Number(process.env.PGPORT),
  },
});