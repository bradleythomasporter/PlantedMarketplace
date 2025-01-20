import { pgTable, text, serial, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
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
  latitude: decimal('latitude'),
  longitude: decimal('longitude'),
  serviceRadius: decimal('service_radius'),
  businessLicense: text('business_license'),
  rating: decimal('rating'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const plants = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  scientificName: text('scientific_name'),
  category: text('category', { enum: ['indoor', 'outdoor', 'trees', 'shrubs', 'flowers'] }).notNull(),
  description: text('description'),
  price: decimal('price').notNull(),
  imageUrl: text('image_url'),
  nurseryId: serial('nursery_id').notNull().references(() => users.id),
  quantity: serial('quantity').notNull().default(0),
  sunExposure: text('sun_exposure'),
  wateringNeeds: text('watering_needs'),
  height: text('height'),
  spread: text('spread'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  customerId: serial('customer_id').notNull().references(() => users.id),
  nurseryId: serial('nursery_id').notNull().references(() => users.id),
  status: text('status', { enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] }).notNull().default('pending'),
  total: decimal('total').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: serial('order_id').notNull().references(() => orders.id),
  plantId: serial('plant_id').notNull().references(() => plants.id),
  quantity: serial('quantity').notNull(),
  priceAtTime: decimal('price_at_time').notNull(),
  requiresPlanting: boolean('requires_planting').notNull().default(false)
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