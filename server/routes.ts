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
import { point, distance } from "@turf/helpers";
import turfDistance from "@turf/distance";

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

  // Plants listing and search with geospatial filtering
  app.get("/api/plants", async (req, res) => {
    try {
      const {
        search,
        category,
        latitude,
        longitude,
        radius = "10", // Default radius in kilometers
        minPrice,
        maxPrice,
        sortBy
      } = req.query;

      // First, get all available nurseries
      const availableNurseries = await db
        .select({
          id: users.id,
          latitude: users.latitude,
          longitude: users.longitude,
          serviceRadius: users.serviceRadius
        })
        .from(users)
        .where(
          and(
            eq(users.role, "nursery"),
            sql`${users.latitude} IS NOT NULL`,
            sql`${users.longitude} IS NOT NULL`,
            sql`${users.serviceRadius} IS NOT NULL`
          )
        );

      let nurseryIds: number[] = [];

      // If location is provided, filter nurseries by distance
      if (typeof latitude === 'string' && typeof longitude === 'string') {
        const userLocation = point([parseFloat(longitude), parseFloat(latitude)]);

        // Filter nurseries within service radius
        nurseryIds = availableNurseries
          .filter(nursery => {
            const nurseryLocation = point([nursery.longitude!, nursery.latitude!]);
            const distanceInKm = turfDistance(userLocation, nurseryLocation);
            return distanceInKm <= (nursery.serviceRadius || parseFloat(radius));
          })
          .map(nursery => nursery.id);
      } else {
        // If no location provided, include all nurseries
        nurseryIds = availableNurseries.map(nursery => nursery.id);
      }

      // Build the query with the filtered nurseries
      let query = db
        .select()
        .from(plants)
        .where(inArray(plants.nurseryId, nurseryIds));

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

      // Apply conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
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

      // Add distance information if location is provided
      let resultsWithDistance = results;
      if (typeof latitude === 'string' && typeof longitude === 'string') {
        const userLocation = point([parseFloat(longitude), parseFloat(latitude)]);
        resultsWithDistance = results.map(plant => {
          if (plant.latitude && plant.longitude) {
            const plantLocation = point([plant.longitude, plant.latitude]);
            const distanceInKm = turfDistance(userLocation, plantLocation);
            return { ...plant, distance: Math.round(distanceInKm * 100) / 100 };
          }
          return plant;
        });

        // Sort by distance if no other sorting is specified
        if (!sortBy) {
          resultsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
      }

      return res.json(resultsWithDistance);
    } catch (error) {
      console.error('Error fetching plants:', error);
      return res.status(500).json({ message: "Failed to fetch plants" });
    }
  });

  // Plant templates endpoint with organized categories
  app.get("/api/plants/templates", async (_req, res) => {
    try {
      const templates = {
        plantsByType: {
          perennials: [
            {
              name: "Lavender",
              scientificName: "Lavandula angustifolia",
              category: "Perennials",
              description: "Fragrant perennial herb with purple flowers",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Low",
                soil: "Well-drained, sandy soil",
                otherConditions: "Drought-tolerant"
              },
              price: 12.99,
              stockDefault: 20
            },
            {
              name: "Echinacea",
              scientificName: "Echinacea purpurea",
              category: "Perennials",
              description: "Popular flowering plant that attracts pollinators",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium",
                soil: "Well-drained, loamy soil",
                otherConditions: "Attracts pollinators"
              },
              price: 14.99,
              stockDefault: 15
            },
            {
              name: "Hosta",
              scientificName: "Hosta spp.",
              category: "Perennials",
              description: "Shade-loving perennial with attractive foliage",
              growthDetails: {
                sunlight: "Partial to full shade",
                watering: "Medium",
                soil: "Moist, well-drained soil",
                otherConditions: "Great for shade gardens"
              },
              price: 16.99,
              stockDefault: 18
            }
          ],
          shrubs: [
            {
              name: "Hydrangea",
              scientificName: "Hydrangea macrophylla",
              category: "Shrubs",
              description: "Popular flowering shrub with large blooms",
              growthDetails: {
                sunlight: "Partial sun",
                watering: "Medium",
                soil: "Moist, rich soil",
                otherConditions: "Needs pruning after flowering"
              },
              price: 29.99,
              stockDefault: 10
            },
            {
              name: "Lilac",
              scientificName: "Syringa vulgaris",
              category: "Shrubs",
              description: "Fragrant flowering shrub",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium",
                soil: "Well-drained, alkaline soil",
                otherConditions: "Fragrant flowers"
              },
              price: 34.99,
              stockDefault: 8
            }
          ],
          climbers: [
            {
              name: "Clematis",
              scientificName: "Clematis spp.",
              category: "Climbers",
              description: "Versatile climbing plant with showy flowers",
              growthDetails: {
                sunlight: "Full sun to partial shade",
                watering: "Medium",
                soil: "Well-drained soil",
                otherConditions: "Requires trellis support"
              },
              price: 24.99,
              stockDefault: 12
            },
            {
              name: "Wisteria",
              scientificName: "Wisteria sinensis",
              category: "Climbers",
              description: "Dramatic climbing vine with hanging flowers",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium",
                soil: "Well-drained, fertile soil",
                otherConditions: "Needs strong support structure"
              },
              price: 39.99,
              stockDefault: 6
            }
          ],
          bulbs: [
            {
              name: "Tulip",
              scientificName: "Tulipa spp.",
              category: "Bulbs",
              description: "Spring-flowering bulb with colorful blooms",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Moderate",
                soil: "Well-drained, sandy soil",
                otherConditions: "Plant in fall for spring blooms"
              },
              price: 8.99,
              stockDefault: 50
            },
            {
              name: "Daffodil",
              scientificName: "Narcissus spp.",
              category: "Bulbs",
              description: "Classic spring bulb with cheerful flowers",
              growthDetails: {
                sunlight: "Full sun to partial shade",
                watering: "Low",
                soil: "Well-drained soil",
                otherConditions: "Deer-resistant"
              },
              price: 7.99,
              stockDefault: 50
            }
          ],
          bedding: [
            {
              name: "Petunia",
              scientificName: "Petunia spp.",
              category: "Bedding",
              description: "Popular bedding plant with trumpet-shaped flowers",
              growthDetails: {
                sunlight: "Full sun",
                watering: "High",
                soil: "Fertile, well-drained soil",
                otherConditions: "Deadhead for continuous blooms"
              },
              price: 4.99,
              stockDefault: 100
            },
            {
              name: "Marigold",
              scientificName: "Tagetes spp.",
              category: "Bedding",
              description: "Easy-to-grow annual with bright flowers",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium",
                soil: "Well-drained soil",
                otherConditions: "Repels pests in vegetable gardens"
              },
              price: 3.99,
              stockDefault: 100
            }
          ],
          grasses: [
            {
              name: "Fountain Grass",
              scientificName: "Pennisetum alopecuroides",
              category: "Grasses",
              description: "Ornamental grass with feathery plumes",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Low to medium",
                soil: "Well-drained soil",
                otherConditions: "Tolerates drought"
              },
              price: 15.99,
              stockDefault: 20
            },
            {
              name: "Blue Fescue",
              scientificName: "Festuca glauca",
              category: "Grasses",
              description: "Compact ornamental grass with blue-gray foliage",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Low",
                soil: "Well-drained soil",
                otherConditions: "Drought-resistant"
              },
              price: 12.99,
              stockDefault: 25
            }
          ],
          roses: [
            {
              name: "Knock Out Rose",
              scientificName: "Rosa 'Knock Out'",
              category: "Roses",
              description: "Low-maintenance landscape rose",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium",
                soil: "Well-drained soil",
                otherConditions: "Disease-resistant variety"
              },
              price: 29.99,
              stockDefault: 15
            },
            {
              name: "Hybrid Tea Rose",
              scientificName: "Rosa spp.",
              category: "Roses",
              description: "Classic rose variety with elegant blooms",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium",
                soil: "Well-drained soil",
                otherConditions: "Large, fragrant blooms"
              },
              price: 34.99,
              stockDefault: 12
            }
          ],
          ferns: [
            {
              name: "Boston Fern",
              scientificName: "Nephrolepis exaltata",
              category: "Ferns",
              description: "Popular indoor fern with arching fronds",
              growthDetails: {
                sunlight: "Indirect light",
                watering: "High",
                soil: "Rich, moist soil",
                otherConditions: "Loves humidity"
              },
              price: 19.99,
              stockDefault: 20
            },
            {
              name: "Japanese Painted Fern",
              scientificName: "Athyrium niponicum",
              category: "Ferns",
              description: "Decorative fern with silvery fronds",
              growthDetails: {
                sunlight: "Partial shade",
                watering: "Medium",
                soil: "Rich, moist soil",
                otherConditions: "Silver-gray foliage"
              },
              price: 24.99,
              stockDefault: 15
            }
          ],
          fruit: [
            {
              name: "Apple Tree",
              scientificName: "Malus domestica",
              category: "Fruit",
              description: "Popular fruit tree for home orchards",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium",
                soil: "Well-drained, loamy soil",
                otherConditions: "Requires cross-pollination"
              },
              price: 49.99,
              stockDefault: 10
            },
            {
              name: "Blueberry",
              scientificName: "Vaccinium spp.",
              category: "Fruit",
              description: "Productive fruit bush with ornamental value",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium",
                soil: "Acidic, well-drained soil",
                otherConditions: "Produces edible berries"
              },
              price: 29.99,
              stockDefault: 15
            }
          ],
          herbs: [
            {
              name: "Rosemary",
              scientificName: "Rosmarinus officinalis",
              category: "Herbs",
              description: "Aromatic herb with culinary uses",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Low",
                soil: "Well-drained, sandy soil",
                otherConditions: "Drought-tolerant"
              },
              price: 9.99,
              stockDefault: 30
            },
            {
              name: "Thyme",
              scientificName: "Thymus vulgaris",
              category: "Herbs",
              description: "Low-growing herb with culinary value",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Low",
                soil: "Well-drained soil",
                otherConditions: "Used in cooking, attracts pollinators"
              },
              price: 8.99,
              stockDefault: 30
            }
          ],
          vegetables: [
            {
              name: "Tomato",
              scientificName: "Solanum lycopersicum",
              category: "Vegetables",
              description: "Popular vegetable garden plant",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Medium to high",
                soil: "Rich, well-drained soil",
                otherConditions: "Support with stakes or cages"
              },
              price: 6.99,
              stockDefault: 40
            },
            {
              name: "Lettuce",
              scientificName: "Lactuca sativa",
              category: "Vegetables",
              description: "Easy-to-grow leafy vegetable",
              growthDetails: {
                sunlight: "Partial sun",
                watering: "High",
                soil: "Moist, well-drained soil",
                otherConditions: "Cool-season crop"
              },
              price: 4.99,
              stockDefault: 50
            }
          ],
          hedging: [
            {
              name: "Boxwood",
              scientificName: "Buxus sempervirens",
              category: "Hedging",
              description: "Classic formal hedge plant",
              growthDetails: {
                sunlight: "Full sun to partial shade",
                watering: "Low to medium",
                soil: "Well-drained soil",
                otherConditions: "Prune for shape"
              },
              price: 24.99,
              stockDefault: 30
            },
            {
              name: "Yew",
              scientificName: "Taxus baccata",
              category: "Hedging",
              description: "Traditional evergreen hedging plant",
              growthDetails: {
                sunlight: "Partial shade",
                watering: "Low to medium",
                soil: "Well-drained soil",
                otherConditions: "Tolerates heavy pruning"
              },
              price: 29.99,
              stockDefault: 25
            }
          ],
          trees: [
            {
              name: "Oak",
              scientificName: "Quercus spp.",
              category: "Trees",
              description: "Majestic shade tree with long lifespan",
              growthDetails: {
                sunlight: "Full sun",
                watering: "Low to medium",
                soil: "Well-drained, deep soil",
                otherConditions: "Long-lived and strong wood"
              },
              price: 89.99,
              stockDefault: 5
            },
            {
              name: "Maple",
              scientificName: "Acer spp.",
              category: "Trees",
              description: "Deciduous tree with colorful fall foliage",
              growthDetails: {
                sunlight: "Full sun to partial shade",
                watering: "Medium",
                soil: "Well-drained soil",
                otherConditions: "Beautiful fall foliage"
              },
              price: 79.99,
              stockDefault: 8
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