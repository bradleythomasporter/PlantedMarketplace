import pkg from 'pg';
const { Client } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(client, { schema });

export async function connectDB() {
  try {
    await client.connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}