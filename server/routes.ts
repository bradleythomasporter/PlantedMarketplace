import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { plants } from "@db/schema";
import { like, and, or } from "drizzle-orm";
import NodeGeocoder from "node-geocoder";
import { point, distance } from "@turf/helpers";
import turfDistance from "@turf/distance";

const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

export function registerRoutes(app: Express): Server {
  // Basic plants route for listing and searching
  app.get("/api/plants", async (req, res) => {
    try {
      const { search, category, zipCode, radius } = req.query;
      let query = db.select().from(plants);
      const conditions = [];

      if (typeof search === 'string' && search) {
        conditions.push(or(
          like(plants.name, `%${search}%`),
          like(plants.description, `%${search}%`)
        ));
      }

      if (typeof category === 'string' && category && category !== 'all') {
        conditions.push(like(plants.category, category));
      }

      if (typeof zipCode === 'string' && zipCode && typeof radius === 'string' && radius) {
        try {
          const [location] = await geocoder.geocode(zipCode);
          if (location) {
            const radiusMiles = parseInt(radius);
            const center = point([location.longitude, location.latitude]);

            // Get all plants and filter by distance
            const allPlants = await query;
            const filteredPlants = allPlants.filter(plant => {
              const plantPoint = point([plant.longitude, plant.latitude]);
              const distanceInMiles = turfDistance(center, plantPoint, { units: 'miles' });
              return distanceInMiles <= radiusMiles;
            });

            return res.json(filteredPlants);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
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
        // Sample data with location information
        await db.insert(plants).values([
          {
            name: "Peace Lily",
            category: "indoor",
            description: "Beautiful indoor plant that helps purify air",
            price: "29.99",
            imageUrl: "https://images.unsplash.com/photo-1593691509543-c55fb32e7355?auto=format&fit=crop&q=80&w=300",
            nurseryId: 1,
            latitude: 37.7749,
            longitude: -122.4194,
            zipCode: "94103"
          },
          {
            name: "Snake Plant",
            category: "indoor",
            description: "Low maintenance indoor plant",
            price: "24.99",
            imageUrl: "https://images.unsplash.com/photo-1572974496518-4ca44800c24e?auto=format&fit=crop&q=80&w=300",
            nurseryId: 1,
            latitude: 37.7833,
            longitude: -122.4167,
            zipCode: "94111"
          },
          {
            name: "Rose Bush",
            category: "outdoor",
            description: "Classic garden rose bush",
            price: "34.99",
            imageUrl: "https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&q=80&w=300",
            nurseryId: 2,
            latitude: 37.7694,
            longitude: -122.4862,
            zipCode: "94122"
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