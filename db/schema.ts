import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').unique(),
  role: text('role', { enum: ['customer', 'nursery'] }).notNull(),
  name: text('name').notNull(),
  address: text('address'),
  phoneNumber: text('phone_number'),
  description: text('description'),
  hoursOfOperation: text('hours_of_operation'),
  website: text('website'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  serviceRadius: real('service_radius'),
  businessLicense: text('business_license'),
  rating: real('rating'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
});

export const plants = sqliteTable('plants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  scientificName: text('scientific_name'),
  category: text('category').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  imageUrl: text('image_url'),
  nurseryId: integer('nursery_id').notNull().references(() => users.id),
  quantity: integer('quantity').notNull().default(0),
  sunExposure: text('sun_exposure'),
  wateringNeeds: text('watering_needs'),
  height: text('height'),
  spread: text('spread'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => users.id),
  nurseryId: integer('nursery_id').notNull().references(() => users.id),
  status: text('status').notNull().default('pending'),
  totalAmount: real('total_amount').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(strftime('%s', 'now'))`)
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id').notNull().references(() => orders.id),
  plantId: integer('plant_id').notNull().references(() => plants.id),
  quantity: integer('quantity').notNull(),
  priceAtTime: real('price_at_time').notNull(),
  requiresPlanting: integer('requires_planting', { mode: 'boolean' }).notNull().default(0)
});

// Relations configuration
export const usersRelations = relations(users, ({ many }) => ({
  plants: many(plants),
  orders: many(orders)
}));

export const plantsRelations = relations(plants, ({ one }) => ({
  nursery: one(users, {
    fields: [plants.nurseryId],
    references: [users.id],
  })
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  nursery: one(users, {
    fields: [orders.nurseryId],
    references: [users.id],
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  plant: one(plants, {
    fields: [orderItems.plantId],
    references: [plants.id],
  })
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// Schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPlantSchema = createInsertSchema(plants);
export const selectPlantSchema = createSelectSchema(plants);
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const selectOrderItemSchema = createSelectSchema(orderItems);