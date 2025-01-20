import { pgTable, text, integer, real, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
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
  latitude: decimal("latitude"),
  longitude: decimal("longitude"),
  serviceRadius: decimal("service_radius"),
  businessLicense: text("business_license"),
  rating: decimal("rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const plants = pgTable("plants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  scientificName: text("scientific_name"),
  category: text("category", { enum: ["indoor", "outdoor", "trees", "shrubs", "flowers"] }).notNull(),
  description: text("description"),
  price: decimal("price").notNull(),
  imageUrl: text("image_url"),
  nurseryId: integer("nursery_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull().default(0),
  sunExposure: text("sun_exposure"),
  wateringNeeds: text("watering_needs"),
  height: text("height"),
  spread: text("spread"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => users.id),
  nurseryId: integer("nursery_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] }).notNull().default("pending"),
  total: decimal("total").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id),
  plantId: integer("plant_id").notNull().references(() => plants.id),
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time").notNull(),
  requiresPlanting: boolean("requires_planting").notNull().default(false),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);