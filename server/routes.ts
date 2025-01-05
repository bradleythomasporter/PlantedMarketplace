import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { db } from "@db";
import { plants, orders, orderItems, type User, type Plant, type Order } from "@db/schema";
import { and, eq, like, desc, SQL } from "drizzle-orm";

// Extend Express.Request to include our User type
declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Plants routes
  app.get("/api/plants", async (req, res) => {
    try {
      const { search, category, nurseryId } = req.query;
      const conditions: SQL[] = [];

      if (typeof search === 'string' && search) {
        conditions.push(like(plants.name, `%${search}%`));
      }

      if (typeof category === 'string' && category) {
        conditions.push(eq(plants.category, category as "flowers" | "trees" | "shrubs" | "indoor" | "outdoor"));
      }

      if (typeof nurseryId === 'string' && nurseryId) {
        conditions.push(eq(plants.nurseryId, parseInt(nurseryId)));
      }

      const results = await db
        .select()
        .from(plants)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(plants.createdAt));

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch plants" });
    }
  });

  app.post("/api/plants", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "nursery") {
      return res.status(403).send("Unauthorized");
    }

    try {
      const [plant] = await db
        .insert(plants)
        .values({ ...req.body, nurseryId: req.user.id })
        .returning();

      res.json(plant);
    } catch (error) {
      res.status(500).json({ message: "Failed to create plant" });
    }
  });

  // Orders routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { nurseryId, items, total } = req.body;

      const [order] = await db
        .insert(orders)
        .values({
          customerId: req.user.id,
          nurseryId,
          status: "pending",
          total,
        })
        .returning();

      await db.insert(orderItems).values(
        items.map((item: any) => ({
          orderId: order.id,
          plantId: item.plantId,
          quantity: item.quantity,
          price: item.price,
        }))
      );

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userOrders = await db
        .select()
        .from(orders)
        .where(
          req.user.role === "customer"
            ? eq(orders.customerId, req.user.id)
            : eq(orders.nurseryId, req.user.id)
        )
        .orderBy(desc(orders.createdAt));

      res.json(userOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}