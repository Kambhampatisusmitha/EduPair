import { pgTable, text, serial, integer, boolean, jsonb, timestamp, pgEnum, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === Users ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullname: text("fullname").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatar: customType<{ data: Buffer }>({
    dataType() { return "bytea"; }
  })("avatar"),
  teachSkills: jsonb("teach_skills").$type<string[]>().default([]),
  learnSkills: jsonb("learn_skills").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  sentRequests: many(pairingRequests, { relationName: "requester" }),
  receivedRequests: many(pairingRequests, { relationName: "recipient" }),
  sessions: many(learningSessions, { relationName: "participant" }),
}));

// === Pairing Requests ===
export const requestStatusEnum = pgEnum("request_status", [
  "pending", 
  "accepted", 
  "declined", 
  "cancelled"
]);

export const pairingRequests = pgTable("pairing_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  teachSkills: jsonb("teach_skills").$type<string[]>().default([]),
  learnSkills: jsonb("learn_skills").$type<string[]>().default([]),
  status: requestStatusEnum("status").notNull().default("pending"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pairingRequestsRelations = relations(pairingRequests, ({ one }) => ({
  requester: one(users, {
    fields: [pairingRequests.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  recipient: one(users, {
    fields: [pairingRequests.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
  session: one(learningSessions, {
    fields: [pairingRequests.id],
    references: [learningSessions.requestId],
  }),
}));

// === Learning Sessions ===
export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled", 
  "completed", 
  "cancelled"
]);

export const learningSessions = pgTable("learning_sessions", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull().references(() => pairingRequests.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull(), // minutes
  location: text("location").default("online"),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const learningSessionsRelations = relations(learningSessions, ({ one, many }) => ({
  request: one(pairingRequests, {
    fields: [learningSessions.requestId],
    references: [pairingRequests.id],
  }),
  participants: many(sessionParticipants),
}));

// === Session Participants ===
export const sessionParticipants = pgTable("session_participants", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => learningSessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  attended: boolean("attended").default(false),
  feedback: text("feedback"),
  rating: integer("rating"), // 1-5
});

export const sessionParticipantsRelations = relations(sessionParticipants, ({ one }) => ({
  session: one(learningSessions, {
    fields: [sessionParticipants.sessionId],
    references: [learningSessions.id],
  }),
  user: one(users, {
    fields: [sessionParticipants.userId],
    references: [users.id],
    relationName: "participant",
  }),
}));

// === Schema Validation ===
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  fullname: z.string(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
  teachSkills: z.array(z.string()).optional(),
  learnSkills: z.array(z.string()).optional(),
});

export const createPairingRequestSchema = createInsertSchema(pairingRequests).pick({
  recipientId: true,
  teachSkills: true,
  learnSkills: true,
  message: true,
});

export const createSessionSchema = createInsertSchema(learningSessions).pick({
  requestId: true,
  scheduledDate: true,
  duration: true,
  location: true,
  notes: true,
});

// === Type Exports ===
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type CreatePairingRequest = z.infer<typeof createPairingRequestSchema>;
export type CreateSession = z.infer<typeof createSessionSchema>;

export type User = typeof users.$inferSelect;
export type PairingRequest = typeof pairingRequests.$inferSelect;
export type LearningSession = typeof learningSessions.$inferSelect;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;
