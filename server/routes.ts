import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { plants } from "@db/schema";
import { like, and, or, eq } from "drizzle-orm";
import NodeGeocoder from "node-geocoder";
import { setupAuth } from "./auth";
import distance from "@turf/distance";
import { point } from "@turf/helpers";

const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Get individual plant
  app.get("/api/plants/:id", async (req, res) => {
    try {
      const [plant] = await db
        .select()
        .from(plants)
        .where(eq(plants.id, parseInt(req.params.id)))
        .limit(1);

      if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
      }

      res.json(plant);
    } catch (error) {
      console.error('Error fetching plant:', error);
      res.status(500).json({ message: "Failed to fetch plant" });
    }
  });

  // Update plant
  app.patch("/api/plants/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "nursery") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const plantId = parseInt(req.params.id);

      // Verify the plant belongs to this nursery
      const [existingPlant] = await db
        .select()
        .from(plants)
        .where(and(
          eq(plants.id, plantId),
          eq(plants.nurseryId, req.user.id)
        ))
        .limit(1);

      if (!existingPlant) {
        return res.status(404).json({ message: "Plant not found" });
      }

      const [updatedPlant] = await db
        .update(plants)
        .set(req.body)
        .where(eq(plants.id, plantId))
        .returning();

      res.json(updatedPlant);
    } catch (error) {
      console.error('Error updating plant:', error);
      res.status(500).json({ message: "Failed to update plant" });
    }
  });

  // Delete plant
  app.delete("/api/plants/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "nursery") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const plantId = parseInt(req.params.id);

      // Verify the plant belongs to this nursery
      const [existingPlant] = await db
        .select()
        .from(plants)
        .where(and(
          eq(plants.id, plantId),
          eq(plants.nurseryId, req.user.id)
        ))
        .limit(1);

      if (!existingPlant) {
        return res.status(404).json({ message: "Plant not found" });
      }

      await db
        .delete(plants)
        .where(eq(plants.id, plantId));

      res.json({ message: "Plant deleted successfully" });
    } catch (error) {
      console.error('Error deleting plant:', error);
      res.status(500).json({ message: "Failed to delete plant" });
    }
  });

  // Geocoding endpoint
  app.get("/api/geocode", async (req, res) => {
    try {
      const { address } = req.query;
      if (!address || typeof address !== 'string') {
        return res.status(400).json({ message: "Address is required" });
      }

      const [location] = await geocoder.geocode(address);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      res.json({
        latitude: location.latitude,
        longitude: location.longitude,
        zipCode: location.zipcode || "00000" // Fallback ZIP code
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      res.status(500).json({ message: "Failed to geocode address" });
    }
  });

  // Plants listing and search
  app.get("/api/plants", async (req, res) => {
    try {
      const { search, category, zipCode, radius, nurseryId } = req.query;
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

      if (typeof nurseryId === 'string' && nurseryId) {
        conditions.push(eq(plants.nurseryId, parseInt(nurseryId)));
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
              if (!plant.latitude || !plant.longitude) return false;
              const plantPoint = point([plant.longitude, plant.latitude]);
              const distanceInMiles = distance(center, plantPoint, { units: 'miles' });
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

  // Add plant route (requires authentication)
  app.post("/api/plants", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "nursery") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const plantData = {
        ...req.body,
        nurseryId: req.user.id,
      };

      const [newPlant] = await db
        .insert(plants)
        .values(plantData)
        .returning();

      res.json(newPlant);
    } catch (error) {
      console.error('Error adding plant:', error);
      res.status(500).json({ message: "Failed to add plant" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}