import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { plants } from "@db/schema";
import { and, eq, like, desc } from "drizzle-orm";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  // Setup authentication first
  setupAuth(app);

  // Plants routes
  app.get("/api/plants", async (req, res) => {
    try {
      const { search, category } = req.query;
      const conditions = [];

      if (typeof search === 'string' && search) {
        conditions.push(like(plants.name, `%${search}%`));
      }

      if (typeof category === 'string' && category) {
        conditions.push(eq(plants.category, category as any));
      }

      const results = await db
        .select()
        .from(plants)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(plants.createdAt));

      res.json(results);
    } catch (error) {
      console.error('Error fetching plants:', error);
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
      console.error('Error creating plant:', error);
      res.status(500).json({ message: "Failed to create plant" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}