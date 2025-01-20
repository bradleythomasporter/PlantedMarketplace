import { defineConfig } from "drizzle-kit";
import path from 'path';

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "turso",
  dbCredentials: {
    url: path.join(process.cwd(), 'sqlite.db'),
  },
});