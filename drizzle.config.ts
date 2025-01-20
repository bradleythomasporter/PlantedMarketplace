import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable must be set");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  driver: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});