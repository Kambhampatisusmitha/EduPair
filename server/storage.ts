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
      avatar: "",
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
    // Exclude current user and sensitive fields like password
    let query = db
      .select({
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
      .where(not(eq(users.id, options.currentUserId)))
      .limit(options.limit)
      .offset(options.offset);
    
    // Filter by teach skills if specified
    if (options.teachSkills && options.teachSkills.length > 0) {
      query = query.where(
        sql`${users.teachSkills} ?| array[${options.teachSkills.join(',')}]`
      );
    }
    
    // Filter by learn skills if specified
    if (options.learnSkills && options.learnSkills.length > 0) {
      query = query.where(
        sql`${users.learnSkills} ?| array[${options.learnSkills.join(',')}]`
      );
    }
    
    return query;
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
    let query = db
      .select({
        // Request fields
        id: pairingRequests.id,
        requesterId: pairingRequests.requesterId,
        recipientId: pairingRequests.recipientId,
        teachSkills: pairingRequests.teachSkills,
        learnSkills: pairingRequests.learnSkills,
        status: pairingRequests.status,
        message: pairingRequests.message,
        createdAt: pairingRequests.createdAt,
        updatedAt: pairingRequests.updatedAt,
        // Requester fields (excluding password)
        requester: {
          id: users.id,
          fullname: users.fullname,
          displayName: users.displayName,
          avatar: users.avatar,
          teachSkills: users.teachSkills,
          learnSkills: users.learnSkills
        }
      })
      .from(pairingRequests)
      .innerJoin(users, eq(pairingRequests.requesterId, users.id));
    
    // Add recipient join
    const otherUsers = alias(users, "recipients");
    query = query.innerJoin(
      otherUsers, 
      eq(pairingRequests.recipientId, otherUsers.id)
    ).select({
      // Add recipient fields
      recipient: {
        id: otherUsers.id,
        fullname: otherUsers.fullname,
        displayName: otherUsers.displayName,
        avatar: otherUsers.avatar,
        teachSkills: otherUsers.teachSkills,
        learnSkills: otherUsers.learnSkills
      }
    });
    
    // Apply filters
    if (options.type === 'sent') {
      query = query.where(eq(pairingRequests.requesterId, options.userId));
    } else if (options.type === 'received') {
      query = query.where(eq(pairingRequests.recipientId, options.userId));
    } else {
      // 'all' - show both sent and received
      query = query.where(
        or(
          eq(pairingRequests.requesterId, options.userId),
          eq(pairingRequests.recipientId, options.userId)
        )
      );
    }
    
    // Filter by status if specified
    if (options.status) {
      query = query.where(eq(pairingRequests.status, options.status));
    }
    
    // Order by most recent first
    query = query.orderBy(desc(pairingRequests.createdAt));
    
    return query;
  }
  
  async updatePairingRequestStatus(id: number, status: string): Promise<PairingRequest> {
    const [updatedRequest] = await db
      .update(pairingRequests)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(pairingRequests.id, id))
      .returning();
      
    if (!updatedRequest) {
      throw new Error("Pairing request not found");
    }
    
    return updatedRequest;
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
    
    // Get sessions
    let query = db
      .select()
      .from(learningSessions)
      .where(inArray(learningSessions.id, sessionIds));
    
    // Filter by status if specified
    if (options.status) {
      query = query.where(eq(learningSessions.status, options.status));
    }
    
    // Order by upcoming sessions first
    query = query.orderBy(learningSessions.scheduledDate);
    
    const sessions = await query;
    
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
      .where(
        and(
          eq(sessionParticipants.sessionId, sessionId),
          eq(sessionParticipants.userId, userId)
        )
      );
      
    return !!participant;
  }
  
  async updateSession(id: number, updateData: Partial<LearningSession>): Promise<LearningSession> {
    const data = {
      ...updateData,
      updatedAt: new Date()
    };
    
    const [updatedSession] = await db
      .update(learningSessions)
      .set(data)
      .where(eq(learningSessions.id, id))
      .returning();
      
    if (!updatedSession) {
      throw new Error("Learning session not found");
    }
    
    return updatedSession;
  }

  // === Matching Methods ===
  async getSuggestedMatches(options: GetSuggestedMatchesOptions): Promise<SuggestedMatch[]> {
    // Get the current user
    const currentUser = await this.getUser(options.userId);
    if (!currentUser) {
      throw new Error("User not found");
    }
    
    // Get all users except the current user
    const otherUsers = await this.getUsers({
      currentUserId: options.userId,
      limit: 50,  // Get a reasonable amount of users to find matches
      offset: 0
    });
    
    if (otherUsers.length === 0) {
      return [];
    }
    
    // Calculate match scores
    const matches: SuggestedMatch[] = otherUsers.map(user => {
      // Find skills where user can teach what current user wants to learn
      const matchingTeachSkills = (user.teachSkills || []).filter(skill => 
        (currentUser.learnSkills || []).includes(skill)
      );
      
      // Find skills where user wants to learn what current user can teach
      const matchingLearnSkills = (user.learnSkills || []).filter(skill => 
        (currentUser.teachSkills || []).includes(skill)
      );
      
      // Calculate match score based on number of matching skills
      const matchScore = matchingTeachSkills.length + matchingLearnSkills.length;
      
      return {
        user,
        matchingTeachSkills,
        matchingLearnSkills,
        matchScore
      };
    });
    
    // Sort by match score (highest first) and limit results
    const sortedMatches = matches
      .filter(match => match.matchScore > 0)  // Only include actual matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(options.offset, options.offset + options.limit);
    
    return sortedMatches;
  }
}

export const storage = new DatabaseStorage();
