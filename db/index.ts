import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const db = drizzle({
  connection: process.env.DATABASE_URL,
  schema,
  ws: ws,
});

export async function connectDB() {
  try {
    // For Neon, the connection is established lazily
    // Just log that we're ready to connect
    console.log("Database configuration ready");
  } catch (error) {
    console.error("Database configuration failed:", error);
    throw error;
  }
}