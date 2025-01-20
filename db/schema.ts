import { pgTable, text, serial, decimal, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique(),  
  role: text("role", { enum: ["customer", "nursery"] }).notNull(),
  name: text("name").notNull(),
  address: text("address"),
  phoneNumber: text("phone_number"),
  description: text("description"),
  hoursOfOperation: text("hours_of_operation"),
  website: text("website"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  serviceRadius: real("service_radius"), 
  businessLicense: text("business_license"),
  rating: real("rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scientificName: text("scientific_name"),
  category: text("category", { enum: ["indoor", "outdoor", "trees", "shrubs", "flowers"] }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  nurseryId: integer("nursery_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  sunExposure: text("sun_exposure"),
  wateringNeeds: text("watering_needs"),
  height: text("height"),
  spread: text("spread"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const plantsRelations = relations(plants, ({ one }) => ({
  nursery: one(users, {
    fields: [plants.nurseryId],
    references: [users.id],
  }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);