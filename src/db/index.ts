import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    "postgresql://postgres:postgres@localhost:5432/cinebook";

  // When deployed to Vercel with Neon, SSL is required
  const isNeon = connectionString.includes("neon.tech") || connectionString.includes("sslmode=require");

  pool = new Pool({
    connectionString,
    ssl: isNeon ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}

export const db = getDb();
export { schema };
