import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { plants, orders, users } from "@db/schema";
import { like, and, or, eq, inArray, gte, sql } from "drizzle-orm";
import NodeGeocoder from "node-geocoder";
import { setupAuth } from "./auth";

const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

export function registerRoutes(app: Express): Server {
  // Setup authentication routes and middleware first
  setupAuth(app);

  // Plant templates endpoint
  app.get("/api/plants/templates", async (_req, res) => {
    try {
      // Comprehensive plant templates with detailed information
      const templates = [
        // Outdoor Plants - Trees and Shrubs
        {
          id: "red-robin",
          name: "Red Robin",
          scientificName: "Photinia x fraseri 'Red Robin'",
          category: "shrubs",
          subCategory: "evergreen",
          description: "Popular evergreen shrub with bright red young leaves that mature to glossy dark green. Perfect for hedging.",
          growthDetails: {
            height: "2.5-4m",
            spread: "2.5-4m",
            growthRate: "Average",
            ultimateHeight: "4 meters",
            timeToUltimateHeight: "10-20 years"
          },
          careInstructions: {
            sunlight: "Full sun to partial shade",
            watering: "Water regularly until established, then drought tolerant",
            soil: "Well-drained, fertile soil",
            pruning: "Prune in spring or early summer to encourage new red growth",
            fertilizer: "Apply balanced fertilizer in spring"
          },
          properties: {
            hardinessZone: "USDA 7-10",
            soilType: ["Clay", "Loam", "Sand"],
            moisture: "Well-drained",
            ph: "Acid, Neutral, Alkaline",
            droughtTolerant: true,
            frostTolerant: true
          },
          seasonalInterest: {
            spring: "Bright red new growth",
            summer: "Glossy dark green foliage",
            autumn: "Continued red new growth",
            winter: "Evergreen structure"
          },
          imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae",
          mainCategory: "outdoor"
        },
        {
          id: "japanese-maple",
          name: "Japanese Maple",
          scientificName: "Acer palmatum",
          category: "trees",
          subCategory: "deciduous",
          description: "Elegant ornamental tree known for its delicate foliage and stunning autumn colors.",
          growthDetails: {
            height: "4-6m",
            spread: "3-5m",
            growthRate: "Slow",
            ultimateHeight: "6 meters",
            timeToUltimateHeight: "20-50 years"
          },
          careInstructions: {
            sunlight: "Partial shade to dappled sunlight",
            watering: "Regular watering, keep soil moist",
            soil: "Rich, well-draining acidic soil",
            pruning: "Light pruning in late winter",
            fertilizer: "Spring and early summer feeding"
          },
          properties: {
            hardinessZone: "USDA 5-8",
            soilType: ["Loam", "Sandy"],
            moisture: "Moist but well-drained",
            ph: "Acidic to neutral",
            droughtTolerant: false,
            frostTolerant: true
          },
          seasonalInterest: {
            spring: "Fresh lime-green leaves",
            summer: "Deep purple-red foliage",
            autumn: "Brilliant red and orange colors",
            winter: "Attractive bark structure"
          },
          imageUrl: "https://images.unsplash.com/photo-1615672968435-75cd1c6a36e5",
          mainCategory: "outdoor"
        },
        // Outdoor Plants - Perennials
        {
          id: "lavender-hidcote",
          name: "Lavender 'Hidcote'",
          scientificName: "Lavandula angustifolia 'Hidcote'",
          category: "perennials",
          subCategory: "herbs",
          description: "Compact English lavender variety with deep purple flowers and intense fragrance. Perfect for borders and containers.",
          growthDetails: {
            height: "40-60cm",
            spread: "40-60cm",
            growthRate: "Medium",
            ultimateHeight: "60cm",
            timeToUltimateHeight: "2-5 years"
          },
          careInstructions: {
            sunlight: "Full sun",
            watering: "Low water needs once established",
            soil: "Well-drained, poor to moderately fertile soil",
            pruning: "Cut back after first flush of flowers to encourage second bloom",
            fertilizer: "Light feeding in spring"
          },
          properties: {
            hardinessZone: "USDA 5-9",
            soilType: ["Chalk", "Loam", "Sand"],
            moisture: "Well-drained",
            ph: "Neutral, Alkaline",
            droughtTolerant: true,
            frostTolerant: true
          },
          seasonalInterest: {
            spring: "Silver-grey foliage",
            summer: "Deep purple flowers",
            autumn: "Extended flowering",
            winter: "Evergreen structure"
          },
          imageUrl: "https://images.unsplash.com/photo-1468327768560-75b778cbb551",
          mainCategory: "outdoor"
        },
        {
          id: "purple-coneflower",
          name: "Purple Coneflower",
          scientificName: "Echinacea purpurea",
          category: "perennials",
          subCategory: "flowering",
          description: "Stunning native perennial with large daisy-like flowers that attract butterflies and bees.",
          growthDetails: {
            height: "60-90cm",
            spread: "45-60cm",
            growthRate: "Fast",
            ultimateHeight: "90cm",
            timeToUltimateHeight: "2-3 years"
          },
          careInstructions: {
            sunlight: "Full sun",
            watering: "Moderate, drought tolerant once established",
            soil: "Well-drained, rich soil",
            pruning: "Deadhead spent flowers",
            fertilizer: "Light feeding in spring"
          },
          properties: {
            hardinessZone: "USDA 3-9",
            soilType: ["Clay", "Loam", "Sand"],
            moisture: "Medium",
            ph: "Neutral",
            droughtTolerant: true,
            frostTolerant: true
          },
          seasonalInterest: {
            spring: "Fresh green growth",
            summer: "Purple-pink flowers",
            autumn: "Extended blooming",
            winter: "Seedheads for birds"
          },
          imageUrl: "https://images.unsplash.com/photo-1597892657493-6847b6770acd",
          mainCategory: "outdoor"
        },
        // Indoor Plants
        {
          id: "peace-lily",
          name: "Peace Lily",
          scientificName: "Spathiphyllum wallisii",
          category: "indoor",
          subCategory: "foliage plants",
          description: "Popular indoor plant with elegant white flowers and glossy dark green leaves. Excellent air-purifying qualities.",
          growthDetails: {
            height: "45-65cm",
            spread: "45-65cm",
            growthRate: "Medium",
            ultimateHeight: "65cm",
            timeToUltimateHeight: "3-5 years"
          },
          careInstructions: {
            sunlight: "Indirect light to partial shade",
            watering: "Keep soil consistently moist",
            soil: "Rich, well-draining potting mix",
            pruning: "Remove spent flowers and yellowed leaves",
            fertilizer: "Monthly feeding during growing season"
          },
          properties: {
            hardinessZone: "USDA 11-12",
            soilType: ["Potting mix"],
            moisture: "Moist but well-drained",
            ph: "Acid, Neutral",
            droughtTolerant: false,
            frostTolerant: false
          },
          seasonalInterest: {
            spring: "Active growth period",
            summer: "White flowers",
            autumn: "Continued growth",
            winter: "Possible flowering"
          },
          imageUrl: "https://images.unsplash.com/photo-1593691509543-c55fb32e7355",
          mainCategory: "indoor"
        },
        {
          id: "monstera",
          name: "Swiss Cheese Plant",
          scientificName: "Monstera deliciosa",
          category: "indoor",
          subCategory: "foliage plants",
          description: "Trendy tropical plant with distinctive split leaves, perfect for creating a jungle atmosphere indoors.",
          growthDetails: {
            height: "2-3m",
            spread: "1-2m",
            growthRate: "Fast",
            ultimateHeight: "3m indoors",
            timeToUltimateHeight: "5-10 years"
          },
          careInstructions: {
            sunlight: "Bright indirect light",
            watering: "Allow top soil to dry between waterings",
            soil: "Well-draining, rich potting mix",
            pruning: "Remove yellow leaves, control size",
            fertilizer: "Monthly during growing season"
          },
          properties: {
            hardinessZone: "USDA 10-12",
            soilType: ["Potting mix"],
            moisture: "Medium",
            ph: "Slightly acidic to neutral",
            droughtTolerant: false,
            frostTolerant: false
          },
          seasonalInterest: {
            spring: "New leaf growth",
            summer: "Rapid growth",
            autumn: "Continued growth",
            winter: "Slower growth"
          },
          imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b",
          mainCategory: "indoor"
        },
        {
          id: "orchid",
          name: "Phalaenopsis Orchid",
          scientificName: "Phalaenopsis hybrid",
          category: "indoor",
          subCategory: "flowering plants",
          description: "Elegant moth orchid with long-lasting blooms, perfect for brightening indoor spaces.",
          growthDetails: {
            height: "45-60cm",
            spread: "30-45cm",
            growthRate: "Slow",
            ultimateHeight: "60cm",
            timeToUltimateHeight: "2-3 years"
          },
          careInstructions: {
            sunlight: "Bright indirect light",
            watering: "Weekly, allow to dry slightly",
            soil: "Specialized orchid mix",
            pruning: "Cut spent flower stems",
            fertilizer: "Weak orchid fertilizer bi-weekly"
          },
          properties: {
            hardinessZone: "USDA 10-12",
            soilType: ["Orchid mix"],
            moisture: "Medium",
            ph: "Slightly acidic",
            droughtTolerant: false,
            frostTolerant: false
          },
          seasonalInterest: {
            spring: "Potential blooming",
            summer: "Active growth",
            autumn: "Potential blooming",
            winter: "Rest period"
          },
          imageUrl: "https://images.unsplash.com/photo-1624809781812-9129d89c6764",
          mainCategory: "indoor"
        }
      ];

      // Group templates by main category
      const groupedTemplates = templates.reduce((acc, template) => {
        if (!acc[template.mainCategory]) {
          acc[template.mainCategory] = [];
        }
        acc[template.mainCategory].push(template);
        return acc;
      }, {} as Record<string, any[]>);

      return res.json(groupedTemplates);
    } catch (error) {
      console.error('Error fetching plant templates:', error);
      return res.status(500).json({ message: "Failed to fetch plant templates" });
    }
  });

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

      return res.json({ url: session.url });
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
      return res.status(500).json({
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

      return res.json(plant);
    } catch (error) {
      console.error('Error fetching plant:', error);
      return res.status(500).json({ message: "Failed to fetch plant" });
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

      return res.json(nurseryOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: "Failed to fetch orders" });
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

      return res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ message: "Failed to update order" });
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

      return res.json(updatedPlant);
    } catch (error) {
      console.error('Error updating plant:', error);
      return res.status(500).json({ message: "Failed to update plant" });
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

      return res.json({ message: "Plant deleted successfully" });
    } catch (error) {
      console.error('Error deleting plant:', error);
      return res.status(500).json({ message: "Failed to delete plant" });
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

      return res.json({
        latitude: location.latitude,
        longitude: location.longitude,
        zipCode: location.zipcode || "00000" // Fallback ZIP code
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      return res.status(500).json({ message: "Failed to geocode address" });
    }
  });

  // Plants listing and search
  app.get("/api/plants", async (req, res) => {
    try {
      const {
        search,
        category,
        zipCode,
        radius,
        minPrice,
        maxPrice,
        sortBy
      } = req.query;

      let query = db.select().from(plants);
      const conditions = [];

      // Search by name or description (case-insensitive)
      if (typeof search === 'string' && search) {
        conditions.push(sql`(
          LOWER(${plants.name}) LIKE ${`%${search.toLowerCase()}%`} OR
          LOWER(${plants.description}) LIKE ${`%${search.toLowerCase()}%`}
        )`);
      }

      // Filter by category
      if (typeof category === 'string' && category && category !== 'all') {
        conditions.push(sql`${plants.category} = ${category}`);
      }

      // Price range filter
      if (typeof minPrice === 'string' && typeof maxPrice === 'string') {
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);
        if (!isNaN(min) && !isNaN(max)) {
          conditions.push(sql`${plants.price} BETWEEN ${min} AND ${max}`);
        }
      }

      // Location-based search
      if (typeof zipCode === 'string' && zipCode && typeof radius === 'string' && radius) {
        try {
          const [location] = await geocoder.geocode(zipCode);
          if (location) {
            const radiusMiles = parseInt(radius);

            // Create an earth_box around the search point using the radius
            const result = await db.execute(sql`
              WITH point_data AS (
                SELECT ll_to_earth(${location.latitude}, ${location.longitude}) AS search_point,
                       ll_to_earth(latitude, longitude) AS plant_point,
                       *
                FROM plants
                ${conditions.length > 0 ? sql`WHERE ${and(...conditions)}` : sql``}
              )
              SELECT *, 
                earth_distance(search_point, plant_point) * 0.000621371 AS distance_miles
              FROM point_data
              WHERE earth_distance(search_point, plant_point) * 0.000621371 <= ${radiusMiles}
              ${sortBy === 'price_asc' ? sql`ORDER BY price ASC, distance_miles ASC` :
                sortBy === 'price_desc' ? sql`ORDER BY price DESC, distance_miles ASC` :
                sortBy === 'newest' ? sql`ORDER BY created_at DESC, distance_miles ASC` :
                sql`ORDER BY distance_miles ASC`}
            `);

            return res.json(result.rows);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          return res.status(400).json({ message: "Invalid ZIP code or location not found" });
        }
      }

      // If not doing location search, use regular query with sorting
      if (conditions.length > 0) {
        query = query.where(sql`${and(...conditions)}`);
      }

      // Apply sorting
      if (typeof sortBy === 'string') {
        switch (sortBy) {
          case 'price_asc':
            query = query.orderBy(sql`${plants.price} ASC`);
            break;
          case 'price_desc':
            query = query.orderBy(sql`${plants.price} DESC`);
            break;
          case 'newest':
            query = query.orderBy(sql`${plants.createdAt} DESC`);
            break;
          // Default to relevance (no specific ordering)
        }
      }

      const results = await query;
      return res.json(results);
    } catch (error) {
      console.error('Error fetching plants:', error);
      return res.status(500).json({ message: "Failed to fetch plants" });
    }
  });

  // Add plant route (requires authentication)
  app.post("/api/plants", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "nursery") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { name, category, description, price, quantity, imageUrl } = req.body;

      // Basic validation
      if (!name || !category || !price || !quantity) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const plantData = {
        name,
        category,
        description: description || "",
        price,
        quantity,
        imageUrl: imageUrl || "",
        nurseryId: req.user.id,
        latitude: req.user.latitude,
        longitude: req.user.longitude,
        zipCode: req.user.address.match(/\d{5}/)?.[0] || "00000",
      };

      const [newPlant] = await db
        .insert(plants)
        .values(plantData)
        .returning();

      return res.json(newPlant);
    } catch (error) {
      console.error('Error adding plant:', error);
      return res.status(500).json({ message: "Failed to add plant" });
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
      return res.json(nurseryWithoutPassword);
    } catch (error) {
      console.error('Error fetching nursery:', error);
      return res.status(500).json({ message: "Failed to fetch nursery" });
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
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}