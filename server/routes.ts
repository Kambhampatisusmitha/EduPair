import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, updateProfileSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import * as crypto from "crypto";

// Hash a password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.post("/api/users/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Hash password before storing
      const hashedPassword = hashPassword(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      // Set session (simulating login after registration)
      if (req.session) {
        req.session.userId = user.id;
      }
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  app.post("/api/users/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== hashPassword(password)) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set session
      if (req.session) {
        req.session.userId = user.id;
      }
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });
  
  app.post("/api/users/logout", (req: Request, res: Response) => {
    // Destroy session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        res.status(200).json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "Logged out successfully" });
    }
  });
  
  app.get("/api/users/me", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  app.post("/api/users/profile", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.session?.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const profileData = updateProfileSchema.parse(req.body);
      
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserProfile(req.session.userId, profileData);
      
      // Don't return the password
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
