import { pgTable, text, serial, decimal, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email").unique(),  
  role: text("role", { enum: ["customer", "nursery"] }).notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
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
  category: text("category", { enum: ["flowers", "trees", "shrubs", "indoor", "outdoor"] }).notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  zipCode: text("zip_code"),
  matureSize: text("mature_size"),
  maintainanceLevel: text("maintainance_level"),
  additionalImages: text("additional_images").array(),
  plantingInstructions: text("planting_instructions"),
  seasonalAvailability: text("seasonal_availability"),
  careInstructions: text("care_instructions"),
  height: text("height"),
  spread: text("spread"),
  growthRate: text("growth_rate"),
  sunExposure: text("sun_exposure"),
  soilType: text("soil_type"),
  wateringNeeds: text("watering_needs"),
  hardinessZone: text("hardiness_zone"),
  floweringSeason: text("flowering_season"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  featured: boolean("featured").default(false),
  inStock: boolean("in_stock").notNull().default(true),
  isAvailableForDelivery: boolean("is_available_for_delivery").default(true),
});

export const plantInventory = pgTable("plant_inventory", {
  id: serial("id").primaryKey(),
  plantId: integer("plant_id").notNull(),
  nurseryId: integer("nursery_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  size: text("size").notNull(), 
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  nurseryId: integer("nursery_id").notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
  }).notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  deliveryLatitude: real("delivery_latitude"),
  deliveryLongitude: real("delivery_longitude"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  requiresPlanting: boolean("requires_planting").notNull().default(false),
  plantingScheduledAt: timestamp("planting_scheduled_at"),
  notes: text("notes"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  plantId: integer("plant_id").notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type Plant = typeof plants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type PlantInventory = typeof plantInventory.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;
export type NewOrder = typeof orders.$inferInsert;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type NewPlantInventory = typeof plantInventory.$inferInsert;

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);
export const insertPlantInventorySchema = createInsertSchema(plantInventory);
export const selectPlantInventorySchema = createSelectSchema(plantInventory);