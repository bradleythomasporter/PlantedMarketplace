import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { plants, orders, users } from "@db/schema";
import { like, and, or, eq, inArray, gte } from "drizzle-orm";
import NodeGeocoder from "node-geocoder";
import { setupAuth } from "./auth";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import Stripe from "stripe";

// Validate Stripe key format
const isValidStripeKey = (key: string) => {
  return key && (key.startsWith('sk_test_') || key.startsWith('sk_live_'));
};

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

if (!isValidStripeKey(process.env.STRIPE_SECRET_KEY)) {
  throw new Error("Invalid STRIPE_SECRET_KEY format. Key must start with 'sk_test_' or 'sk_live_'");
}

// Initialize Stripe with proper configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Use latest stable API version
  apiVersion: '2023-10-16' as const,
  typescript: true,
});

const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

// Maximum length for Stripe URLs
const MAX_STRIPE_URL_LENGTH = 2000; // Keep under 2048 to be safe

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Checkout endpoint
  app.post("/api/checkout", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Please log in to proceed with checkout" });
    }

    try {
      const { items } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Fetch all plants in one query
      const plantIds = items.map(item => item.plantId);
      const plantsData = await db
        .select()
        .from(plants)
        .where(and(
          inArray(plants.id, plantIds),
          gte(plants.quantity, 1)
        ));

      // Validate all items exist and are in stock
      for (const item of items) {
        const plant = plantsData.find(p => p.id === item.plantId);
        if (!plant) {
          return res.status(400).json({
            message: `Plant ${item.plantId} not found or no longer available`
          });
        }
        if (plant.quantity < item.quantity) {
          return res.status(400).json({
            message: `Not enough stock for ${plant.name}. Only ${plant.quantity} available`
          });
        }
      }

      // Create line items for Stripe
      const lineItems = items.map(item => {
        const plant = plantsData.find(p => p.id === item.plantId)!;
        const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
          name: plant.name,
          description: plant.description || undefined,
        };

        // Only add image if URL is valid and not too long
        if (plant.imageUrl && plant.imageUrl.length < MAX_STRIPE_URL_LENGTH) {
          productData.images = [plant.imageUrl];
        }

        return {
          price_data: {
            currency: "usd",
            product_data: productData,
            unit_amount: Math.round(Number(plant.price) * 100), // Convert to cents
          },
          quantity: item.quantity,
        };
      });

      // Add planting service fee if requested
      const plantingServices = items.filter(item => item.requiresPlanting);
      if (plantingServices.length > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Professional Planting Service",
              description: "Expert planting service by certified gardeners",
            },
            unit_amount: 4999, // $49.99
          },
          quantity: plantingServices.length,
        });
      }

      // Get base URL for success and cancel URLs
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      // Create Stripe checkout session with proper configuration
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout/cancel`,
        metadata: {
          userId: req.user.id.toString(),
          items: JSON.stringify(items),
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error);

      // Handle Stripe-specific errors
      if (error instanceof Stripe.errors.StripeError) {
        return res.status(error.statusCode || 500).json({
          message: error.message,
          type: error.type
        });
      }

      // Handle general errors
      res.status(500).json({
        message: "Unable to process checkout at this time. Please try again later.",
        type: "server_error"
      });
    }
  });

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

  // Get orders for a nursery
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "nursery") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const nurseryOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.nurseryId, req.user.id))
        .orderBy(orders.createdAt);

      res.json(nurseryOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status
  app.patch("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "nursery") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Verify the order belongs to this nursery
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(and(
          eq(orders.id, orderId),
          eq(orders.nurseryId, req.user.id)
        ))
        .limit(1);

      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ message: "Failed to update order" });
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

  // Get nursery details
  app.get("/api/nurseries/:id", async (req, res) => {
    try {
      const [nursery] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, parseInt(req.params.id)),
          eq(users.role, "nursery")
        ))
        .limit(1);

      if (!nursery) {
        return res.status(404).json({ message: "Nursery not found" });
      }

      // Don't send the password
      const { password: _, ...nurseryWithoutPassword } = nursery;
      res.json(nurseryWithoutPassword);
    } catch (error) {
      console.error('Error fetching nursery:', error);
      res.status(500).json({ message: "Failed to fetch nursery" });
    }
  });

  // Add profile update endpoint
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user.id))
        .returning();

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}