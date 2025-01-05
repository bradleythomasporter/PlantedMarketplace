import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { plants } from "@db/schema";
import { like } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Basic plants route for listing and searching
  app.get("/api/plants", async (req, res) => {
    try {
      const { search, category } = req.query;
      let query = db.select().from(plants);

      if (typeof search === 'string' && search) {
        query = query.where(like(plants.name, `%${search}%`));
      }

      if (typeof category === 'string' && category) {
        query = query.where(like(plants.category, category));
      }

      const results = await query;
      res.json(results);
    } catch (error) {
      console.error('Error fetching plants:', error);
      res.status(500).json({ message: "Failed to fetch plants" });
    }
  });

  // Add sample data
  app.post("/api/sample-data", async (req, res) => {
    try {
      const existingPlants = await db.select().from(plants);

      if (existingPlants.length === 0) {
        await db.insert(plants).values([
          {
            name: "Peace Lily",
            category: "indoor",
            description: "Beautiful indoor plant that helps purify air",
            price: "29.99",
            imageUrl: "https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&q=80&w=300"
          },
          {
            name: "Snake Plant",
            category: "indoor",
            description: "Low maintenance indoor plant",
            price: "24.99",
            imageUrl: "https://images.unsplash.com/photo-1572974496518-4ca44800c24e?auto=format&fit=crop&q=80&w=300"
          },
          {
            name: "Rose Bush",
            category: "outdoor",
            description: "Classic garden rose bush",
            price: "34.99",
            imageUrl: "https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&q=80&w=300"
          }
        ]);
      }

      res.json({ message: "Sample data added successfully" });
    } catch (error) {
      console.error('Error adding sample data:', error);
      res.status(500).json({ message: "Failed to add sample data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}