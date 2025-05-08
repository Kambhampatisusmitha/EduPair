import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullname: text("fullname").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatar: text("avatar"),
  teachSkills: jsonb("teach_skills").$type<string[]>().default([]),
  learnSkills: jsonb("learn_skills").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullname: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  displayName: true,
  bio: true,
  avatar: true,
  teachSkills: true,
  learnSkills: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type User = typeof users.$inferSelect;
