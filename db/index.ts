import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

// Export schema for use in queries
export { schema };

type DrizzleDb = ReturnType<typeof drizzle>;

const globalForDb = globalThis as unknown as {
  neonPool?: Pool;
  drizzleDb?: DrizzleDb;
};

const pool =
  globalForDb.neonPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

const db = globalForDb.drizzleDb ?? drizzle({ client: pool, schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.neonPool = pool;
  globalForDb.drizzleDb = db;
}

export function getDb() {
  return db;
}
