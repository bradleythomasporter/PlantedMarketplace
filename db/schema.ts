import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["customer", "nursery"] }).notNull(),
  name: text("name").notNull(),
  address: text("address"),
  description: text("description"),
  hoursOfOperation: text("hours_of_operation"),
  createdAt: timestamp("created_at").defaultNow()
});

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  nurseryId: integer("nursery_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  category: text("category", { enum: ["flowers", "trees", "shrubs", "indoor", "outdoor"] }).notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// Define relationships
export const plantsRelations = relations(plants, ({ one }) => ({
  nursery: one(users, {
    fields: [plants.nurseryId],
    references: [users.id]
  })
}));

// Export types and schemas
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);