import { pgTable, text, serial, integer, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["customer", "nursery"] }).notNull(),
  name: text("name").notNull(),
  address: text("address"),
  location: jsonb("location").$type<{lat: number, lng: number}>(),
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

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => users.id).notNull(),
  nurseryId: integer("nursery_id").references(() => users.id).notNull(),
  status: text("status", { enum: ["pending", "confirmed", "completed"] }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  plantId: integer("plant_id").references(() => plants.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull()
});

export const plantsRelations = relations(plants, ({ one }) => ({
  nursery: one(users, {
    fields: [plants.nurseryId],
    references: [users.id]
  })
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id]
  }),
  nursery: one(users, {
    fields: [orders.nurseryId],
    references: [users.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  plant: one(plants, {
    fields: [orderItems.plantId],
    references: [plants.id]
  })
}));

export type User = typeof users.$inferSelect;
export type Plant = typeof plants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);
