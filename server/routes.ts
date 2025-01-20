import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { plants, orders, users } from "@db/schema";
import { like, and, or, eq, inArray, gte, sql } from "drizzle-orm";
import NodeGeocoder from "node-geocoder";
import { setupAuth } from "./auth";
import multer from "multer";
import { parse } from "csv-parse";
import stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);
const MAX_STRIPE_URL_LENGTH = 500;

const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

const upload = multer({ storage: multer.memoryStorage() });

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Plant templates endpoint with organized categories
  app.get("/api/plants/templates", async (_req, res) => {
    try {
      const templates = {
        plantsByType: {
          houseplants: [
            {
              name: "Chinese Evergreen",
              scientificName: "Aglaonema commutatum",
              category: "houseplants",
              description: "Popular low-maintenance houseplant known for its decorative leaves and air-purifying qualities.",
              growthDetails: {
                height: "60-90cm",
                spread: "30-60cm",
                growthRate: "Slow to Moderate",
              },
              care: {
                sunlight: "Low to Medium",
                watering: "Moderate",
                soil: "Well-draining potting mix",
                maintenance: "Low",
                temperatureRange: "16-27°C",
              },
              price: 24.99,
              stockDefault: 15
            },
            {
              name: "Snake Plant",
              scientificName: "Sansevieria trifasciata",
              category: "houseplants",
              description: "Architectural plant with striking upright leaves, excellent air purifier.",
              growthDetails: {
                height: "70-120cm",
                spread: "30-60cm",
                growthRate: "Slow",
              },
              care: {
                sunlight: "Low to Bright",
                watering: "Low",
                soil: "Well-draining cactus mix",
                maintenance: "Very Low",
                temperatureRange: "15-30°C",
              },
              price: 29.99,
              stockDefault: 20
            }
          ],
          tropicals: [
            {
              name: "Bird of Paradise",
              scientificName: "Strelitzia reginae",
              category: "tropicals",
              description: "Dramatic tropical plant with distinctive paddle-shaped leaves and exotic flowers.",
              growthDetails: {
                height: "150-200cm",
                spread: "120-180cm",
                growthRate: "Moderate",
              },
              care: {
                sunlight: "Bright",
                watering: "Moderate to High",
                soil: "Rich, well-draining mix",
                maintenance: "Medium",
                temperatureRange: "18-30°C",
              },
              price: 89.99,
              stockDefault: 8
            },
            {
              name: "Monstera Deliciosa",
              scientificName: "Monstera deliciosa",
              category: "tropicals",
              description: "Popular tropical plant with distinctive split leaves, also known as Swiss Cheese Plant.",
              growthDetails: {
                height: "200-300cm",
                spread: "120-150cm",
                growthRate: "Fast",
              },
              care: {
                sunlight: "Bright Indirect",
                watering: "Moderate",
                soil: "Rich, well-draining mix",
                maintenance: "Medium",
                temperatureRange: "20-30°C",
              },
              price: 49.99,
              stockDefault: 12
            }
          ],
          succulents: [
            {
              name: "Zebra Haworthia",
              scientificName: "Haworthia fasciata",
              category: "succulents",
              description: "Small succulent with distinctive white stripes, perfect for desks and windowsills.",
              growthDetails: {
                height: "10-15cm",
                spread: "10-15cm",
                growthRate: "Slow",
              },
              care: {
                sunlight: "Bright Indirect",
                watering: "Low",
                soil: "Cactus mix",
                maintenance: "Very Low",
                temperatureRange: "18-32°C",
              },
              price: 14.99,
              stockDefault: 25
            },
            {
              name: "String of Pearls",
              scientificName: "Senecio rowleyanus",
              category: "succulents",
              description: "Trailing succulent with small, round leaves resembling a string of beads.",
              growthDetails: {
                height: "5-10cm",
                spread: "90-120cm",
                growthRate: "Moderate",
              },
              care: {
                sunlight: "Bright Indirect",
                watering: "Low",
                soil: "Well-draining cactus mix",
                maintenance: "Low",
                temperatureRange: "18-24°C",
              },
              price: 19.99,
              stockDefault: 15
            }
          ],
          herbs: [
            {
              name: "English Lavender",
              scientificName: "Lavandula angustifolia",
              category: "herbs",
              description: "Fragrant herb with purple flowers, excellent for gardens and containers.",
              growthDetails: {
                height: "45-60cm",
                spread: "45-60cm",
                growthRate: "Moderate",
              },
              care: {
                sunlight: "Full Sun",
                watering: "Low",
                soil: "Well-draining, alkaline",
                maintenance: "Low",
                temperatureRange: "15-30°C",
              },
              price: 12.99,
              stockDefault: 30
            },
            {
              name: "Sweet Basil",
              scientificName: "Ocimum basilicum",
              category: "herbs",
              description: "Popular culinary herb with aromatic leaves, essential for Mediterranean cooking.",
              growthDetails: {
                height: "30-60cm",
                spread: "30-45cm",
                growthRate: "Fast",
              },
              care: {
                sunlight: "Full Sun",
                watering: "Moderate",
                soil: "Rich, well-draining",
                maintenance: "Medium",
                temperatureRange: "18-30°C",
              },
              price: 8.99,
              stockDefault: 40
            }
          ]
        },
        seasonalPlants: {
          spring: [
            {
              name: "Cherry Blossom",
              scientificName: "Prunus serrulata",
              category: "trees",
              description: "Ornamental cherry tree with stunning spring blossoms.",
              growthDetails: {
                height: "400-800cm",
                spread: "400-800cm",
                growthRate: "Moderate",
              },
              care: {
                sunlight: "Full Sun",
                watering: "Moderate",
                soil: "Well-draining, slightly acidic",
                maintenance: "Medium",
                temperatureRange: "15-25°C",
              },
              price: 149.99,
              stockDefault: 5
            }
          ],
          summer: [
            {
              name: "Dahlia 'Café au Lait'",
              scientificName: "Dahlia 'Café au Lait'",
              category: "flowers",
              description: "Large, dinner-plate sized blooms in creamy pink tones.",
              growthDetails: {
                height: "90-120cm",
                spread: "60-90cm",
                growthRate: "Fast",
              },
              care: {
                sunlight: "Full Sun",
                watering: "Moderate to High",
                soil: "Rich, well-draining",
                maintenance: "High",
                temperatureRange: "18-28°C",
              },
              price: 16.99,
              stockDefault: 20
            }
          ],
          autumn: [
            {
              name: "Japanese Maple",
              scientificName: "Acer palmatum",
              category: "trees",
              description: "Small tree with spectacular autumn foliage.",
              growthDetails: {
                height: "300-500cm",
                spread: "300-500cm",
                growthRate: "Slow",
              },
              care: {
                sunlight: "Partial Shade",
                watering: "Moderate",
                soil: "Well-draining, acidic",
                maintenance: "Medium",
                temperatureRange: "15-25°C",
              },
              price: 129.99,
              stockDefault: 8
            }
          ],
          winter: [
            {
              name: "Christmas Rose",
              scientificName: "Helleborus niger",
              category: "flowers",
              description: "Winter-flowering perennial with white blooms.",
              growthDetails: {
                height: "30-45cm",
                spread: "30-45cm",
                growthRate: "Slow",
              },
              care: {
                sunlight: "Partial Shade",
                watering: "Moderate",
                soil: "Rich, well-draining",
                maintenance: "Low",
                temperatureRange: "5-15°C",
              },
              price: 22.99,
              stockDefault: 15
            }
          ]
        }
      };

      return res.json(templates);
    } catch (error) {
      console.error('Error fetching plant templates:', error);
      return res.status(500).json({ message: "Failed to fetch plant templates" });
    }
  });

  // CSV upload endpoint for bulk plant import
  app.post("/api/plants/upload", upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "nursery") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const records: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true
      });

      parser.on('readable', () => {
        let record;
        while ((record = parser.read())) {
          records.push({
            name: record.name,
            scientificName: record.scientificName || null,
            category: record.category,
            description: record.description || "",
            price: parseFloat(record.price),
            quantity: parseInt(record.quantity),
            imageUrl: record.imageUrl || "",
            nurseryId: req.user.id,
            sunExposure: record.sunExposure || null,
            wateringNeeds: record.wateringNeeds || null,
            soilType: record.soilType || null,
            hardinessZone: record.hardinessZone || null,
            matureSize: record.matureSize || null,
            growthRate: record.growthRate || null,
            maintainanceLevel: record.maintainanceLevel || null,
          });
        }
      });

      parser.on('end', async () => {
        try {
          await db.insert(plants).values(records);
          res.json({ message: `Successfully imported ${records.length} plants` });
        } catch (error) {
          console.error('Error inserting plants:', error);
          res.status(500).json({ message: "Failed to import plants" });
        }
      });

      parser.write(req.file.buffer.toString());
      parser.end();
    } catch (error) {
      console.error('Error processing CSV:', error);
      return res.status(500).json({ message: "Failed to process CSV file" });
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
      const session = await stripeClient.checkout.sessions.create({
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
      if (error instanceof stripe.errors.StripeError) {
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
        // Make location fields optional
        ...(req.user.latitude && { latitude: req.user.latitude }),
        ...(req.user.longitude && { longitude: req.user.longitude }),
        zipCode: req.user.address?.match(/\d{5}/)?.[0] || null,
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