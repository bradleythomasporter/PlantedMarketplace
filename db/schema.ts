import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
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
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const plants = sqliteTable("plants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  scientificName: text("scientific_name"),
  category: text("category", { enum: ["indoor", "outdoor", "trees", "shrubs", "flowers"] }).notNull(),
  description: text("description"),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  nurseryId: integer("nursery_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  sunExposure: text("sun_exposure"),
  wateringNeeds: text("watering_needs"),
  height: text("height"),
  spread: text("spread"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);