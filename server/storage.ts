import { 
  users, 
  pairingRequests,
  learningSessions,
  sessionParticipants,
  type User, 
  type InsertUser, 
  type UpdateProfile,
  type PairingRequest,
  type CreatePairingRequest,
  type LearningSession,
  type CreateSession,
  type SessionParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, not, like, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// Add this near the top of the file, after imports
type RequestStatus = "pending" | "accepted" | "declined" | "cancelled";

// Interface for Storage
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, profile: UpdateProfile): Promise<User>;
  getUsers(options: GetUsersOptions): Promise<Partial<User>[]>;
  
  // Pairing request methods
  createPairingRequest(request: CreatePairingRequest & { requesterId: number }): Promise<PairingRequest>;
  getPairingRequest(id: number): Promise<PairingRequest | undefined>;
  getPairingRequestByUsers(requesterId: number, recipientId: number): Promise<PairingRequest | undefined>;
  getPairingRequests(options: GetPairingRequestsOptions): Promise<(PairingRequest & { requester: Partial<User>, recipient: Partial<User> })[]>;
  updatePairingRequestStatus(id: number, status: string): Promise<PairingRequest>;
  deletePairingRequest(id: number): Promise<void>;
  
  // Learning session methods
  createSession(session: CreateSession, participantIds: number[]): Promise<LearningSession & { participants: SessionParticipant[] }>;
  getSession(id: number): Promise<(LearningSession & { participants: SessionParticipant[] }) | undefined>;
  getUserSessions(options: GetUserSessionsOptions): Promise<(LearningSession & { participants: (SessionParticipant & { user: Partial<User> })[] })[]>;
  isSessionParticipant(sessionId: number, userId: number): Promise<boolean>;
  updateSession(id: number, updateData: Partial<LearningSession>): Promise<LearningSession>;
  
  // Matching methods
  getSuggestedMatches(options: GetSuggestedMatchesOptions): Promise<SuggestedMatch[]>;
}

// Types for querying
interface GetUsersOptions {
  currentUserId: number;
  limit: number;
  offset: number;
  teachSkills?: string[];
  learnSkills?: string[];
}

interface GetPairingRequestsOptions {
  userId: number;
  status?: string;
  type: 'sent' | 'received' | 'all';
}

interface GetUserSessionsOptions {
  userId: number;
  status?: string;
}

interface GetSuggestedMatchesOptions {
  userId: number;
  limit: number;
  offset: number;
}

export interface SuggestedMatch {
  user: Partial<User>;
  matchingTeachSkills: string[];
  matchingLearnSkills: string[];
  matchScore: number;
  minSkillsExchanged?: number;
  totalSkillsExchanged?: number;
}

export class DatabaseStorage implements IStorage {
  // === User Methods ===
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = {
      ...insertUser,
      displayName: insertUser.fullname,
      bio: "",
      avatar: null,
      teachSkills: [],
      learnSkills: []
    };
    
    const [createdUser] = await db
      .insert(users)
      .values(user)
      .returning();
      
    return createdUser;
  }
  
  async updateUserProfile(id: number, profile: UpdateProfile): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, id))
      .returning();
      
    if (!updatedUser) {
      throw new Error("User not found");
    }
    
    return updatedUser;
  }
  
  async getUsers(options: GetUsersOptions): Promise<Partial<User>[]> {
    // Build up the where clause
    let whereExpr: any = not(eq(users.id, options.currentUserId));
    if (options.teachSkills && options.teachSkills.length > 0) {
      whereExpr = and(whereExpr, sql`${users.teachSkills} ?| array[${options.teachSkills.join(',')}]`);
    }
    if (options.learnSkills && options.learnSkills.length > 0) {
      whereExpr = and(whereExpr, sql`${users.learnSkills} ?| array[${options.learnSkills.join(',')}]`);
    }
    // Use object builder
    return db.select({
      id: users.id,
      fullname: users.fullname,
      displayName: users.displayName,
      bio: users.bio,
      avatar: users.avatar,
      teachSkills: users.teachSkills,
      learnSkills: users.learnSkills,
      createdAt: users.createdAt
    })
    .from(users)
    .where(whereExpr)
    .limit(options.limit)
    .offset(options.offset);
  }

  // === Pairing Request Methods ===
  async createPairingRequest(request: CreatePairingRequest & { requesterId: number }): Promise<PairingRequest> {
    const [pairingRequest] = await db
      .insert(pairingRequests)
      .values(request)
      .returning();
      
    return pairingRequest;
  }
  
  async getPairingRequest(id: number): Promise<PairingRequest | undefined> {
    const [request] = await db
      .select()
      .from(pairingRequests)
      .where(eq(pairingRequests.id, id));
      
    return request || undefined;
  }
  
  async getPairingRequestByUsers(requesterId: number, recipientId: number): Promise<PairingRequest | undefined> {
    const [request] = await db
      .select()
      .from(pairingRequests)
      .where(
        and(
          eq(pairingRequests.requesterId, requesterId),
          eq(pairingRequests.recipientId, recipientId)
        )
      )
      .orderBy(desc(pairingRequests.createdAt))
      .limit(1);
      
    return request || undefined;
  }
  
  async getPairingRequests(options: GetPairingRequestsOptions): Promise<(PairingRequest & { requester: Partial<User>, recipient: Partial<User> })[]> {
    const otherUsers = alias(users, "recipients");

    // Build up the where clause
    let whereExpr: any;
    if (options.type === 'sent') {
      whereExpr = eq(pairingRequests.requesterId, options.userId);
    } else if (options.type === 'received') {
      whereExpr = eq(pairingRequests.recipientId, options.userId);
    } else {
      whereExpr = or(
        eq(pairingRequests.requesterId, options.userId),
        eq(pairingRequests.recipientId, options.userId)
      );
    }

    if (options.status) {
      const validStatuses: RequestStatus[] = ["pending", "accepted", "declined", "cancelled"];
      let statusValue: RequestStatus | undefined = undefined;
      if (validStatuses.includes(options.status as RequestStatus)) {
        statusValue = options.status as RequestStatus;
      }
      if (statusValue) {
        whereExpr = and(whereExpr, eq(pairingRequests.status, statusValue));
      }
    }

    // Use the correct Drizzle object builder pattern
    return db
      .select({
        id: pairingRequests.id,
        requesterId: pairingRequests.requesterId,
        recipientId: pairingRequests.recipientId,
        teachSkills: pairingRequests.teachSkills,
        learnSkills: pairingRequests.learnSkills,
        status: pairingRequests.status,
        message: pairingRequests.message,
        createdAt: pairingRequests.createdAt,
        updatedAt: pairingRequests.updatedAt,
        requester: {
          id: users.id,
          fullname: users.fullname,
          displayName: users.displayName,
          avatar: users.avatar,
          teachSkills: users.teachSkills,
          learnSkills: users.learnSkills
        },
        recipient: {
          id: otherUsers.id,
          fullname: otherUsers.fullname,
          displayName: otherUsers.displayName,
          avatar: otherUsers.avatar,
          teachSkills: otherUsers.teachSkills,
          learnSkills: otherUsers.learnSkills
        }
      })
      .from(pairingRequests)
      .innerJoin(users, eq(pairingRequests.requesterId, users.id))
      .innerJoin(otherUsers, eq(pairingRequests.recipientId, otherUsers.id))
      .where(whereExpr)
      .orderBy(desc(pairingRequests.createdAt));
  }
  
  async updatePairingRequestStatus(id: number, status: string): Promise<PairingRequest> {
    const [updatedRequest] = await db
      .update(pairingRequests)
      .set({
        status: status as RequestStatus,
        updatedAt: new Date()
      })
      .where(eq(pairingRequests.id, id))
      .returning();
    if (!updatedRequest) {
      throw new Error("Pairing request not found");
    }
    return updatedRequest;
  }

  async deletePairingRequest(id: number): Promise<void> {
    await db.delete(pairingRequests).where(eq(pairingRequests.id, id)).execute();
  }

  // === Learning Session Methods ===
  async createSession(session: CreateSession, participantIds: number[]): Promise<LearningSession & { participants: SessionParticipant[] }> {
    // First create the session
    const [createdSession] = await db
      .insert(learningSessions)
      .values(session)
      .returning();
    if (!createdSession) {
      throw new Error("Failed to create learning session");
    }
    // Then create participant records
    const participantsData = participantIds.map(userId => ({
      sessionId: createdSession.id,
      userId
    }));
    const participants = await db
      .insert(sessionParticipants)
      .values(participantsData)
      .returning();
    return {
      ...createdSession,
      participants
    };
  }
  
  async getSession(id: number): Promise<(LearningSession & { participants: SessionParticipant[] }) | undefined> {
    const [session] = await db
      .select()
      .from(learningSessions)
      .where(eq(learningSessions.id, id));
    if (!session) {
      return undefined;
    }
    const participants = await db
      .select()
      .from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, session.id));
    return {
      ...session,
      participants
    };
  }
  
  async getUserSessions(options: GetUserSessionsOptions): Promise<(LearningSession & { participants: (SessionParticipant & { user: Partial<User> })[] })[]> {
    // Find all sessions where user is a participant
    const userParticipations = await db
      .select({
        sessionId: sessionParticipants.sessionId
      })
      .from(sessionParticipants)
      .where(eq(sessionParticipants.userId, options.userId));
    if (userParticipations.length === 0) {
      return [];
    }
    const sessionIds = userParticipations.map(p => p.sessionId);
    // Build up the where clause
    let whereExpr: any = inArray(learningSessions.id, sessionIds);
    if (options.status) {
      const validStatuses = ["cancelled", "scheduled", "completed"];
      if (validStatuses.includes(options.status)) {
        whereExpr = and(whereExpr, eq(learningSessions.status, options.status as "cancelled" | "scheduled" | "completed"));
      }
    }
    // Use object builder
    const sessions = await db.select()
      .from(learningSessions)
      .where(whereExpr)
      .orderBy(learningSessions.scheduledDate);
    // Get participants for these sessions with user info
    const participants = await db
      .select({
        id: sessionParticipants.id,
        sessionId: sessionParticipants.sessionId,
        userId: sessionParticipants.userId,
        attended: sessionParticipants.attended,
        feedback: sessionParticipants.feedback,
        rating: sessionParticipants.rating,
        user: {
          id: users.id,
          fullname: users.fullname,
          displayName: users.displayName,
          avatar: users.avatar,
          teachSkills: users.teachSkills,
          learnSkills: users.learnSkills,
        }
      })
      .from(sessionParticipants)
      .innerJoin(users, eq(sessionParticipants.userId, users.id))
      .where(inArray(sessionParticipants.sessionId, sessionIds));
    // Combine sessions with their participants
    return sessions.map(session => {
      const sessionParticipants = participants.filter(p => p.sessionId === session.id);
      return {
        ...session,
        participants: sessionParticipants
      };
    });
  }
  
  async isSessionParticipant(sessionId: number, userId: number): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(sessionParticipants)
      .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.userId, userId)));
    return !!participant;
  }
  
  async updateSession(id: number, updateData: Partial<LearningSession>): Promise<LearningSession> {
    const [updatedSession] = await db
      .update(learningSessions)
      .set(updateData)
      .where(eq(learningSessions.id, id))
      .returning();
    if (!updatedSession) {
      throw new Error("Session not found");
    }
    return updatedSession;
  }
  
  // === Matching Methods ===
  async getSuggestedMatches(options: GetSuggestedMatchesOptions): Promise<SuggestedMatch[]> {
    console.log("[MATCHES] Starting getSuggestedMatches for userId:", options.userId);
    
    try {
      // Get the current user
      const currentUser = await this.getUser(options.userId);
      if (!currentUser) {
        console.log("[MATCHES] User not found:", options.userId);
        return [];
      }

      // Log user skills for debugging
      console.log("[MATCHES] Current user skills:", {
        teachSkills: currentUser.teachSkills,
        learnSkills: currentUser.learnSkills
      });
      
      // Handle empty arrays case
      if (!currentUser.learnSkills?.length || !currentUser.teachSkills?.length) {
        console.log("[MATCHES] User has no skills defined");
        return [];
      }
      
      // Get all other users (excluding current user)
      const allUsers = await db
        .select()
        .from(users)
        .where(not(eq(users.id, options.userId)));
      
      console.log("[MATCHES] Found", allUsers.length, "other users to check for matches");
      
      // Implement the new mutual benefit matching algorithm
      const suggestedMatches: SuggestedMatch[] = [];
      
      for (const otherUser of allUsers) {
        // Skip users with no skills
        if (!otherUser.teachSkills?.length || !otherUser.learnSkills?.length) {
          console.log("[MATCHES] Skipping user", otherUser.id, "with no skills defined");
          continue;
        }
        
        console.log("[MATCHES] Checking match with user:", otherUser.id, {
          theirTeachSkills: otherUser.teachSkills,
          theirLearnSkills: otherUser.learnSkills
        });
        
        // Find skills that match in both directions
        // What you can teach them (your teach skills that match their learn skills)
        const youCanTeachThem = currentUser.teachSkills.filter(skill => 
          otherUser.learnSkills?.includes(skill) ?? false
        );
        
        // What they can teach you (their teach skills that match your learn skills)
        const theyCanTeachYou = otherUser.teachSkills.filter(skill => 
          currentUser.learnSkills?.includes(skill) ?? false
        );
        
        console.log("[MATCHES] Match results for user", otherUser.id, {
          youCanTeachThem,
          theyCanTeachYou
        });
        
        // A match exists if and only if there is at least one match in both directions
        if (youCanTeachThem.length > 0 && theyCanTeachYou.length > 0) {
          // Calculate match score
          // Base score of 100 for having a mutual match
          // Plus 10 points for each additional matching skill
          const matchScore = 100 + ((youCanTeachThem.length + theyCanTeachYou.length) * 10);
          
          console.log("[MATCHES] Found mutual benefit match with user:", otherUser.id, {
            matchScore,
            youCanTeachThem,
            theyCanTeachYou
          });
          
          // Remove password from user object
          const { password, ...userWithoutPassword } = otherUser;
          
          const minSkillsExchanged = Math.min(youCanTeachThem.length, theyCanTeachYou.length);
          const totalSkillsExchanged = youCanTeachThem.length + theyCanTeachYou.length;
          
          suggestedMatches.push({
            user: userWithoutPassword,
            matchingTeachSkills: youCanTeachThem,   // What you can teach them
            matchingLearnSkills: theyCanTeachYou,   // What they can teach you
            matchScore,
            minSkillsExchanged,
            totalSkillsExchanged
          });
        } else {
          console.log("[MATCHES] No mutual benefit match with user:", otherUser.id);
        }
      }
      
      // Sort by match score (highest first)
      suggestedMatches.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log("[MATCHES] Final matches count:", suggestedMatches.length);
      if (suggestedMatches.length > 0) {
        console.log("[MATCHES] First match details:", {
          userId: suggestedMatches[0].user.id,
          matchScore: suggestedMatches[0].matchScore,
          youCanTeachThem: suggestedMatches[0].matchingLearnSkills,
          theyCanTeachYou: suggestedMatches[0].matchingTeachSkills
        });
      }
      
      // Return paginated results
      return suggestedMatches.slice(options.offset, options.offset + options.limit);
    } catch (error) {
      console.error("[MATCHES] Error in getSuggestedMatches:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
