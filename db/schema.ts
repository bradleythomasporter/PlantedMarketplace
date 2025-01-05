import { pgTable, text, serial, decimal, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["customer", "nursery"] }).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  description: text("description"),
  hoursOfOperation: text("hours_of_operation"),
  latitude: real("latitude"),
  longitude: real("longitude"),
});

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: ["flowers", "trees", "shrubs", "indoor", "outdoor"] }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  quantity: integer("quantity").notNull().default(0),
  nurseryId: integer("nursery_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  zipCode: text("zip_code").notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;

// Create Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);