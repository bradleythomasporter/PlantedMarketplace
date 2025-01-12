import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type User as DbUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

const crypto = {
  hash: async (password: string): Promise<string> => {
    const salt = randomBytes(SALT_LENGTH);
    const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
    return `${derivedKey.toString('hex')}.${salt.toString('hex')}`;
  },

  verify: async (password: string, hash: string): Promise<boolean> => {
    const [hashedPassword, salt] = hash.split('.');
    if (!hashedPassword || !salt) return false;

    try {
      const derivedKey = await scryptAsync(password, Buffer.from(salt, 'hex'), KEY_LENGTH);
      const keyBuffer = Buffer.from(hashedPassword, 'hex');
      return timingSafeEqual(derivedKey, keyBuffer);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }
};

// Create a type that excludes the password field
type UserWithoutPassword = Omit<DbUser, 'password'>;

declare global {
  namespace Express {
    interface User extends UserWithoutPassword {}
  }
}

export async function setupAuth(app: Express) {
  try {
    const MemoryStore = createMemoryStore(session);
    const sessionSettings: session.SessionOptions = {
      secret: process.env.REPL_ID || "planted-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: app.get("env") === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    };

    if (app.get("env") === "production") {
      app.set("trust proxy", 1);
    }

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
      new LocalStrategy(async (username, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1);

          if (!user) {
            return done(null, false, { message: "Incorrect username." });
          }

          const isValid = await crypto.verify(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Incorrect password." });
          }

          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (err) {
          return done(err);
        }
      })
    );

    passport.serializeUser((user: Express.User, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!user) {
          return done(null, false);
        }

        const { password: _, ...userWithoutPassword } = user;
        done(null, userWithoutPassword);
      } catch (err) {
        done(err);
      }
    });

    // Register authentication routes
    app.post("/api/register", async (req, res, next) => {
      try {
        const { username, password, role, name, address, description, hoursOfOperation } = req.body;

        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await crypto.hash(password);

        const [newUser] = await db
          .insert(users)
          .values({
            username,
            password: hashedPassword,
            role: role as "customer" | "nursery",
            name,
            address,
            description,
            hoursOfOperation,
          })
          .returning();

        const { password: _, ...userWithoutPassword } = newUser;
        req.login(userWithoutPassword, (err) => {
          if (err) {
            return next(err);
          }
          return res.json(userWithoutPassword);
        });
      } catch (error) {
        next(error);
      }
    });

    app.post("/api/login", (req, res, next) => {
      passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(400).json({ message: info.message ?? "Login failed" });
        }

        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }

          return res.json(user);
        });
      })(req, res, next);
    });

    app.post("/api/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logout successful" });
      });
    });

    app.get("/api/user", (req, res) => {
      if (req.isAuthenticated()) {
        return res.json(req.user);
      }
      res.status(401).json({ message: "Not logged in" });
    });
  } catch (error) {
    console.error("Failed to setup authentication:", error);
    throw error;
  }
}