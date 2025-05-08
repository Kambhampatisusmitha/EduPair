import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  updateProfileSchema, 
  createPairingRequestSchema,
  createSessionSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import * as crypto from "crypto";

// Hash a password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // === Authentication Routes ===
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
  
  // === User Routes ===
  app.get("/api/users/me", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session!.userId);
      
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
  
  app.post("/api/users/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const profileData = updateProfileSchema.parse(req.body);
      
      const user = await storage.getUser(req.session!.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserProfile(req.session!.userId, profileData);
      
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

  // Get users for matching
  app.get("/api/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session!.userId;
      const { limit = 20, offset = 0, teachSkills, learnSkills } = req.query;
      
      const users = await storage.getUsers({
        currentUserId,
        limit: Number(limit),
        offset: Number(offset),
        teachSkills: teachSkills ? String(teachSkills).split(',') : undefined,
        learnSkills: learnSkills ? String(learnSkills).split(',') : undefined
      });
      
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get a specific user by ID
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
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

  // === Pairing Requests Routes ===
  // Create a pairing request
  app.post("/api/pairing-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const requesterId = req.session!.userId;
      const requestData = createPairingRequestSchema.parse(req.body);
      
      // Ensure user isn't sending request to themselves
      if (requestData.recipientId === requesterId) {
        return res.status(400).json({ message: "Cannot send pairing request to yourself" });
      }
      
      // Check if recipient exists
      const recipient = await storage.getUser(requestData.recipientId);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }
      
      // Check if there's already a pending request
      const existingRequest = await storage.getPairingRequestByUsers(requesterId, requestData.recipientId);
      if (existingRequest && existingRequest.status === "pending") {
        return res.status(409).json({ message: "A pending request already exists" });
      }
      
      const pairingRequest = await storage.createPairingRequest({
        requesterId,
        ...requestData
      });
      
      res.status(201).json(pairingRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to create pairing request" });
    }
  });

  // Get all pairing requests for the current user (sent and received)
  app.get("/api/pairing-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { status, type = "all" } = req.query;
      
      const requests = await storage.getPairingRequests({
        userId,
        status: status ? String(status) : undefined,
        type: String(type)
      });
      
      res.status(200).json(requests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch pairing requests" });
    }
  });

  // Update a pairing request status (accept/decline/cancel)
  app.patch("/api/pairing-requests/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      
      const userId = req.session!.userId;
      const { status } = req.body;
      
      if (!["accepted", "declined", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the request
      const request = await storage.getPairingRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Pairing request not found" });
      }
      
      // Check permissions
      if (status === "cancelled" && request.requesterId !== userId) {
        return res.status(403).json({ message: "Only the requester can cancel a request" });
      }
      
      if ((status === "accepted" || status === "declined") && request.recipientId !== userId) {
        return res.status(403).json({ message: "Only the recipient can accept or decline a request" });
      }
      
      // Update the request
      const updatedRequest = await storage.updatePairingRequestStatus(requestId, status);
      
      res.status(200).json(updatedRequest);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update pairing request" });
    }
  });

  // === Learning Sessions Routes ===
  // Create a learning session (after accepting a pairing request)
  app.post("/api/sessions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionData = createSessionSchema.parse(req.body);
      const userId = req.session!.userId;
      
      // Get the associated pairing request
      const request = await storage.getPairingRequest(sessionData.requestId);
      if (!request) {
        return res.status(404).json({ message: "Pairing request not found" });
      }
      
      // Check if request is accepted
      if (request.status !== "accepted") {
        return res.status(400).json({ message: "Cannot create session for non-accepted request" });
      }
      
      // Check if user is part of the request
      if (request.requesterId !== userId && request.recipientId !== userId) {
        return res.status(403).json({ message: "Not authorized to create this session" });
      }
      
      // Create the session
      const session = await storage.createSession(sessionData, [request.requesterId, request.recipientId]);
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error(error);
      res.status(500).json({ message: "Failed to create learning session" });
    }
  });

  // Get all sessions for the current user
  app.get("/api/sessions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { status } = req.query;
      
      const sessions = await storage.getUserSessions({
        userId,
        status: status ? String(status) : undefined
      });
      
      res.status(200).json(sessions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Update a session (reschedule or cancel)
  app.patch("/api/sessions/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const userId = req.session!.userId;
      const { status, scheduledDate, duration, location, notes } = req.body;
      
      // Get the session
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if user is part of the session
      const isParticipant = await storage.isSessionParticipant(sessionId, userId);
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to update this session" });
      }
      
      // Update the session
      const updatedSession = await storage.updateSession(sessionId, {
        status,
        scheduledDate,
        duration,
        location,
        notes
      });
      
      res.status(200).json(updatedSession);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  // Get suggested matches for the current user
  app.get("/api/matches/suggested", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId;
      const { limit = 10, offset = 0 } = req.query;
      
      const matches = await storage.getSuggestedMatches({
        userId,
        limit: Number(limit),
        offset: Number(offset)
      });
      
      res.status(200).json(matches);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch suggested matches" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
