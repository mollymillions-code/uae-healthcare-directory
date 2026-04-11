import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Pool sizing: the process is a Next.js App Router SSR worker. Heavy routes
// (insurance-facet pages, provider listing with EXISTS jsonb queries) do 6-12
// DB roundtrips per render, so at peak concurrent SSR requests the old max=10
// would saturate. QA Round 4 (2026-04-11) caught cold-start 500/502s on
// provider detail pages traced to `timeout exceeded when trying to connect`
// in the pg pool. PostgreSQL on EC2 has max_connections=100, so a single
// PM2 worker can safely take 30 with plenty of headroom for scripts,
// psql sessions, and the other Node apps on the box.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 30,
  min: 4,
  // Short idleTimeoutMillis reclaims connections after 30s of idle so we
  // don't hold 30 open forever when traffic dips.
  idleTimeoutMillis: 30000,
  // Bumped from 5s to 10s so a slow cold-start query (fresh PM2 process
  // JITing + first DB handshake) doesn't blow up with a 500 on the first
  // request after deploy. Still short enough to fail fast when the DB is
  // actually unreachable.
  connectionTimeoutMillis: 10000,
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
