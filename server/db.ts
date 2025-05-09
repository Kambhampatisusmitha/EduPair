import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use environment variable for database connection string
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ER15GuDCvbph@ep-bitter-rain-a4e8gges-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });