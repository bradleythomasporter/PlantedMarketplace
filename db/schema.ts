import { pgTable, text, serial, decimal, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: ["flowers", "trees", "shrubs", "indoor", "outdoor"] }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  nurseryId: integer("nursery_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  zipCode: text("zip_code").notNull(),
});

// Export types
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;

// Create Zod schemas for validation
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);