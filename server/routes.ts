import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  updateProfileSchema, 
  createPairingRequestSchema,
  createSessionSchema
} from "@shared/schema";
import { UpdateProfile } from "@shared/schema";

// Extend UpdateProfile to include avatar for TypeScript
interface ExtendedUpdateProfile extends UpdateProfile {
  avatar?: any;
}

import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import * as crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

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
      console.log("[LOGIN] Incoming login for:", username);
      console.log("[LOGIN] Session before:", req.session);
      console.log("[LOGIN] Cookies:", req.headers.cookie);
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
      console.log("[LOGIN] Session after:", req.session);
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
      console.log("[ME] Session:", req.session);
      console.log("[ME] Cookies:", req.headers.cookie);
      const user = await storage.getUser(req.session!.userId!);
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
      
      const user = await storage.getUser(req.session!.userId!);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserProfile(req.session!.userId!, profileData);
      
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
      const currentUserId = req.session!.userId!;
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
      
      const user = await storage.getUser(userId!);
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

  // Add a teach skill
  app.post("/api/users/me/teach-skills", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId!;
      const { skill } = req.body;
      
      if (!skill || typeof skill !== 'string') {
        return res.status(400).json({ message: "Skill is required and must be a string" });
      }
      
      const user = await storage.getUser(userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentTeachSkills = user.teachSkills || [];
      if (currentTeachSkills.includes(skill.trim())) {
        return res.status(409).json({ message: "Skill already exists" });
      }
      
      const updatedTeachSkills = [...currentTeachSkills, skill.trim()];
      await storage.updateUserProfile(userId, { teachSkills: updatedTeachSkills });
      
      // Get the updated user
      const updatedUser = await storage.getUser(userId!);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const userWithoutPassword = {
        id: updatedUser.id,
        username: updatedUser.username,
        fullname: updatedUser.fullname,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        teachSkills: updatedUser.teachSkills,
        learnSkills: updatedUser.learnSkills,
        createdAt: updatedUser.createdAt
      };
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to add teach skill" });
    }
  });
  
  // Remove a teach skill
  app.delete("/api/users/me/teach-skills", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId!;
      const { skill } = req.body;
      
      if (!skill || typeof skill !== 'string') {
        return res.status(400).json({ message: "Skill is required and must be a string" });
      }
      
      const user = await storage.getUser(userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentTeachSkills = user.teachSkills || [];
      const updatedTeachSkills = currentTeachSkills.filter(s => s !== skill);
      await storage.updateUserProfile(userId, { teachSkills: updatedTeachSkills });
      
      // Get the updated user
      const updatedUser = await storage.getUser(userId!);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const userWithoutPassword = {
        id: updatedUser.id,
        username: updatedUser.username,
        fullname: updatedUser.fullname,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        teachSkills: updatedUser.teachSkills,
        learnSkills: updatedUser.learnSkills,
        createdAt: updatedUser.createdAt
      };
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to remove teach skill" });
    }
  });
  
  // Add a learn skill
  app.post("/api/users/me/learn-skills", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId!;
      const { skill } = req.body;
      
      if (!skill || typeof skill !== 'string') {
        return res.status(400).json({ message: "Skill is required and must be a string" });
      }
      
      const user = await storage.getUser(userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentLearnSkills = user.learnSkills || [];
      if (currentLearnSkills.includes(skill.trim())) {
        return res.status(409).json({ message: "Skill already exists" });
      }
      
      const updatedLearnSkills = [...currentLearnSkills, skill.trim()];
      await storage.updateUserProfile(userId, { learnSkills: updatedLearnSkills });
      
      // Get the updated user
      const updatedUser = await storage.getUser(userId!);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const userWithoutPassword = {
        id: updatedUser.id,
        username: updatedUser.username,
        fullname: updatedUser.fullname,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        teachSkills: updatedUser.teachSkills,
        learnSkills: updatedUser.learnSkills,
        createdAt: updatedUser.createdAt
      };
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to add learn skill" });
    }
  });
  
  // Remove a learn skill
  app.delete("/api/users/me/learn-skills", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId!;
      const { skill } = req.body;
      
      if (!skill || typeof skill !== 'string') {
        return res.status(400).json({ message: "Skill is required and must be a string" });
      }
      
      const user = await storage.getUser(userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentLearnSkills = user.learnSkills || [];
      const updatedLearnSkills = currentLearnSkills.filter(s => s !== skill);
      await storage.updateUserProfile(userId, { learnSkills: updatedLearnSkills });
      
      // Get the updated user
      const updatedUser = await storage.getUser(userId!);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return the password
      const userWithoutPassword = {
        id: updatedUser.id,
        username: updatedUser.username,
        fullname: updatedUser.fullname,
        displayName: updatedUser.displayName,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        teachSkills: updatedUser.teachSkills,
        learnSkills: updatedUser.learnSkills,
        createdAt: updatedUser.createdAt
      };
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to remove learn skill" });
    }
  });

  // === Analytics Routes ===
  app.get("/api/analytics", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("[ANALYTICS] Endpoint called: /api/analytics");
      const userId = req.session!.userId!;
      
      // Get current user to ensure we have their skills
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all users to analyze skill trends
      const allUsers = await storage.getUsers({
        currentUserId: userId,
        limit: 1000,
        offset: 0
      });
      
      console.log(`[ANALYTICS] Found ${allUsers.length} users for skill trend analysis`);
      
      // Get all pairing requests (both sent and received)
      const sentRequests = await storage.getPairingRequests({
        requesterId: userId
      });
      
      const receivedRequests = await storage.getPairingRequests({
        recipientId: userId
      });
      
      console.log(`[ANALYTICS] Found ${sentRequests.length} sent requests and ${receivedRequests.length} received requests`);
      
      // Calculate top skills across the platform
      const learnSkillsCount: Record<string, number> = {};
      const teachSkillsCount: Record<string, number> = {};
      
      // Count occurrences of each skill
      allUsers.forEach(user => {
        if (Array.isArray(user.learnSkills)) {
          user.learnSkills.forEach(skill => {
            if (skill && typeof skill === 'string') {
              learnSkillsCount[skill] = (learnSkillsCount[skill] || 0) + 1;
            }
          });
        }
        
        if (Array.isArray(user.teachSkills)) {
          user.teachSkills.forEach(skill => {
            if (skill && typeof skill === 'string') {
              teachSkillsCount[skill] = (teachSkillsCount[skill] || 0) + 1;
            }
          });
        }
      });
      
      // Convert to arrays and sort by count (descending)
      const topLearnSkills = Object.entries(learnSkillsCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const topTeachSkills = Object.entries(teachSkillsCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      console.log(`[ANALYTICS] Top learn skills: ${topLearnSkills.map(s => s.name).join(', ')}`);
      console.log(`[ANALYTICS] Top teach skills: ${topTeachSkills.map(s => s.name).join(', ')}`);
      
      // Calculate user's pairing stats
      const acceptedRequests = sentRequests.filter(req => req.status === "accepted");
      const declinedRequests = sentRequests.filter(req => req.status === "declined");
      const pendingRequests = sentRequests.filter(req => req.status === "pending");
      
      console.log(`[ANALYTICS] Request stats - Accepted: ${acceptedRequests.length}, Declined: ${declinedRequests.length}, Pending: ${pendingRequests.length}`);
      
      // Find most matched skill by analyzing both sent and received accepted requests
      const skillMatches: Record<string, number> = {};
      
      // Count skills in accepted sent requests
      acceptedRequests.forEach(req => {
        if (Array.isArray(req.skills)) {
          req.skills.forEach(skill => {
            if (skill && typeof skill === 'string') {
              skillMatches[skill] = (skillMatches[skill] || 0) + 1;
            }
          });
        }
      });
      
      // Count skills in accepted received requests
      const acceptedReceivedRequests = receivedRequests.filter(req => req.status === "accepted");
      acceptedReceivedRequests.forEach(req => {
        if (Array.isArray(req.skills)) {
          req.skills.forEach(skill => {
            if (skill && typeof skill === 'string') {
              skillMatches[skill] = (skillMatches[skill] || 0) + 1;
            }
          });
        }
      });
      
      // Find the skill with the highest count
      let mostMatchedSkill = "None";
      let highestCount = 0;
      
      Object.entries(skillMatches).forEach(([skill, count]) => {
        if (count > highestCount) {
          mostMatchedSkill = skill;
          highestCount = count;
        }
      });
      
      console.log(`[ANALYTICS] Most matched skill: ${mostMatchedSkill} (count: ${highestCount})`);
      
      // Prepare response
      const analyticsData = {
        topLearnSkills,
        topTeachSkills,
        userPairingStats: {
          sent: sentRequests.length,
          accepted: acceptedRequests.length,
          declined: declinedRequests.length,
          pending: pendingRequests.length,
          mostMatchedSkill
        }
      };
      
      console.log("[ANALYTICS] Sending response:", {
        topLearnSkillsCount: topLearnSkills.length,
        topTeachSkillsCount: topTeachSkills.length,
        userStats: analyticsData.userPairingStats
      });
      
      return res.status(200).json(analyticsData);
    } catch (error) {
      console.error("[ANALYTICS] Error:", error);
      return res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });
  
  // === Matches Routes ===
  // Simple test endpoint to check API accessibility
  app.get("/api/matches/test", async (req: Request, res: Response) => {
    console.log("[TEST] Test endpoint called");
    return res.status(200).json({ message: "API is working" });
  });

  // Get suggested matches - with fallback for debugging
  app.get("/api/matches/suggested", async (req: Request, res: Response) => {
    try {
      console.log("[MATCHES] Endpoint called: /api/matches/suggested");
      
      // Check if user is authenticated
      const userId = req.session?.userId;
      if (!userId) {
        console.log("[MATCHES] No authenticated user found");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      console.log("[MATCHES] Request parameters:", {
        userId,
        limit,
        offset
      });
      
      // Get user to check if they exist and have skills
      const user = await storage.getUser(userId);
      if (!user) {
        console.log("[MATCHES] User not found:", userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("[MATCHES] User skills:", {
        teachSkills: user.teachSkills,
        learnSkills: user.learnSkills
      });
      
      // Check if user has skills defined
      if (!user.teachSkills?.length || !user.learnSkills?.length) {
        console.log("[MATCHES] User has no skills defined");
        return res.status(200).json([]);
      }
      
      // Call the storage method to get matches
      console.log("[MATCHES] Calling storage.getSuggestedMatches");
      const suggestedMatches = await storage.getSuggestedMatches({
        userId,
        limit,
        offset
      });
      
      console.log("[MATCHES] Found matches count:", suggestedMatches.length);
      if (suggestedMatches.length > 0) {
        console.log("[MATCHES] First match:", {
          userId: suggestedMatches[0].user.id,
          matchScore: suggestedMatches[0].matchScore,
          youCanTeachThem: suggestedMatches[0].matchingLearnSkills,
          theyCanTeachYou: suggestedMatches[0].matchingTeachSkills
        });
      }
      
      console.log("[MATCHES] Sending response with", suggestedMatches.length, "matches");
      return res.status(200).json(suggestedMatches);
    } catch (error) {
      console.error("[MATCHES] Error getting suggested matches:", error);
      return res.status(500).json({ message: "Failed to get suggested matches" });
    }
  });
  
  // === Pairing Requests Routes ===
  // Create a pairing request
  app.post("/api/pairing-requests", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const requesterId = req.session!.userId!;
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
      const userId = req.session!.userId!;
      const { type = "all", status } = req.query;
      console.log("[PAIRING REQUESTS] userId:", userId, "type:", type, "status:", status);
      const requests = await storage.getPairingRequests({
        userId,
        type: type as any,
        status: status as string | undefined,
      });
      console.log("[PAIRING REQUESTS] result count:", requests.length);
      if (requests.length > 0) {
        console.log("[PAIRING REQUESTS] first result:", requests[0]);
      }
      res.json(requests);
    } catch (err) {
      console.error("[PAIRING REQUESTS] error:", err);
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
      
      const userId = req.session!.userId!;
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
      
      // If accepted, create a session if not already created
      let session = null;
      if (status === "accepted") {
        // Check if a session already exists for this request
        const existingSessions = await storage.getUserSessions({ userId, status: undefined });
        const sessionForRequest = existingSessions.find(s => s.requestId === requestId);
        if (!sessionForRequest) {
          // Create a session for both users, default to 1 hour from now
          const scheduledDate = new Date();
          scheduledDate.setHours(scheduledDate.getHours() + 1);
          session = await storage.createSession({
            requestId,
            scheduledDate,
            duration: 60,
            location: "online",
            notes: "Initial session scheduled after match."
          }, [request.requesterId, request.recipientId]);
        } else {
          session = sessionForRequest;
        }
      }
      
      res.status(200).json({ request: updatedRequest, session });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update pairing request" });
    }
  });

  // Delete a pairing request (remove from both dashboards)
  app.delete("/api/pairing-requests/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }
      const userId = req.session!.userId!;
      const request = await storage.getPairingRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Pairing request not found" });
      }
      // Only requester or recipient can delete
      if (request.requesterId !== userId && request.recipientId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      await storage.deletePairingRequest(requestId);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to delete pairing request" });
    }
  });

  // === Learning Sessions Routes ===
  // Create a learning session (after accepting a pairing request)
  app.post("/api/sessions", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const sessionData = createSessionSchema.parse(req.body);
      const userId = req.session!.userId!;
      
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
      const userId = req.session!.userId!;
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
      
      const userId = req.session!.userId!;
      const { status, scheduledDate, duration, location, notes } = req.body;
      
      console.log(`[SESSION UPDATE] Request to update session ${sessionId} by user ${userId}:`, req.body);
      
      // Get the session
      const session = await storage.getSession(sessionId);
      if (!session) {
        console.log(`[SESSION UPDATE] Session ${sessionId} not found`);
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if user is part of the session
      const isParticipant = await storage.isSessionParticipant(sessionId, userId);
      if (!isParticipant) {
        console.log(`[SESSION UPDATE] User ${userId} not authorized to update session ${sessionId}`);
        return res.status(403).json({ message: "Not authorized to update this session" });
      }
      
      // Prepare update data with only the fields that are provided
      const updateData: Partial<LearningSession> = {};
      
      if (status !== undefined) updateData.status = status;
      if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;
      if (duration !== undefined) updateData.duration = duration;
      if (location !== undefined) updateData.location = location;
      if (notes !== undefined) updateData.notes = notes;
      
      console.log(`[SESSION UPDATE] Updating session ${sessionId} with data:`, updateData);
      
      // Update the session
      const updatedSession = await storage.updateSession(sessionId, updateData);
      
      console.log(`[SESSION UPDATE] Session ${sessionId} updated successfully:`, updatedSession);
      res.status(200).json(updatedSession);
    } catch (error) {
      console.error(`[SESSION UPDATE] Error updating session:`, error);
      res.status(500).json({ message: "Failed to update session", error: (error as Error).message });
    }
  });

  // Get suggested matches for the current user
  app.get("/api/matches/suggested", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session!.userId!;
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

  // === Avatar Upload ===
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"));
      }
      cb(null, true);
    },
  });

  app.post("/api/users/me/avatar", isAuthenticated, upload.single("avatar"), async (req: Request, res: Response) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      
      console.log("File received:", req.file.originalname, req.file.mimetype, req.file.size);
      
      // Convert buffer to base64 string for storage
      const base64Image = req.file.buffer.toString('base64');
      
      // Store the image as a base64 string with its mimetype
      const profileUpdate: ExtendedUpdateProfile = {
        avatar: JSON.stringify({
          data: base64Image,
          contentType: req.file.mimetype
        })
      };
      
      await storage.updateUserProfile(req.session!.userId!, profileUpdate as any);
      
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Avatar upload error:", err);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  app.get("/api/users/me/avatar", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user || !user.avatar) {
        return res.status(404).json({ message: "No avatar found" });
      }
      
      try {
        // Parse the stored JSON string - ensure we're working with a string
        const avatarString = typeof user.avatar === 'string' ? user.avatar : 
                            Buffer.isBuffer(user.avatar) ? user.avatar.toString('utf8') : 
                            JSON.stringify(user.avatar);
        
        const avatarData = JSON.parse(avatarString);
        
        // Get the content type and base64 data
        const contentType = avatarData.contentType || "image/png";
        const imageBuffer = Buffer.from(avatarData.data, 'base64');
        
        // Set the content type and send the buffer
        res.setHeader("Content-Type", contentType);
        res.send(imageBuffer);
      } catch (parseError) {
        // Fallback for old avatar format or invalid JSON
        console.error("Error parsing avatar data:", parseError);
        res.setHeader("Content-Type", "image/png");
        res.send(user.avatar);
      }
    } catch (err) {
      console.error("Avatar fetch error:", err);
      res.status(500).json({ message: "Failed to fetch avatar" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
