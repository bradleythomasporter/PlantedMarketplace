import { pgTable, text, serial, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: ["flowers", "trees", "shrubs", "indoor", "outdoor"] }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
});

// Export types
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;