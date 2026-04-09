import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Prevent unhandled pool errors from crashing the process.
// When PostgreSQL restarts (e.g. unattended-upgrades), it sends
// "terminating connection due to administrator command" which would
// otherwise crash Next.js. The pool automatically replaces dead connections.
pool.on("error", (err) => {
  console.error("[DB Pool] Background connection error (non-fatal):", err.message);
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;

// Graceful shutdown — close pool on process termination
if (typeof process !== "undefined") {
  const shutdown = () => { pool.end().catch(() => {}); };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
