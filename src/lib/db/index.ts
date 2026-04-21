import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Pool sizing math (re-derived after QA Round 4 pool fix blew up the build
// with "too many clients already" at 2026-04-11 10:21 UTC):
//
// - PostgreSQL on EC2 has max_connections = 100
// - At rest we observed ~57 active+idle connections across everything
//   (PM2 runtime workers + psql sessions + background scripts)
// - That leaves ~43 connections of headroom in steady state
// - BUT `next build` spawns ~6-8 static-render workers in parallel, each
//   importing this module and creating its own Pool. With `max: 30` each,
//   that's ~240 potential slots — overwhelmingly over budget.
//
// Safe per-process cap so build + runtime both fit under 100 total:
//   max=12. Build phase: ~8 workers × 12 = 96 (safely under 100).
//   Runtime phase: ~2-4 PM2 workers × 12 = 24-48 (plenty of headroom).
//
// Still 20% more than the original max=10 for runtime, so the cold-start
// 500/502 finding from QA Round 4 still benefits. connectionTimeoutMillis
// bumped from 5s to 10s independently so fresh JIT warmup doesn't trip it.
// DB_POOL_MAX override lets runtime (PM2) set a higher cap than build (8
// parallel workers × 12 = 96 stays under PG's max_connections=100), while
// runtime (2-4 workers × 20 = 40-80) gets headroom for the catch-all's
// Promise.allSettled fan-out (up to ~13 concurrent queries per cold render).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: Number(process.env.DB_POOL_MAX) || 12,
  min: 2,
  // Short idleTimeoutMillis reclaims connections after 30s of idle so we
  // don't hold 12 open forever when traffic dips.
  idleTimeoutMillis: 30000,
  // Fresh PM2 processes need a bit more grace on first DB handshake
  // during JIT warmup. Still short enough to fail fast when the DB is
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

// NOTE: No manual SIGTERM/SIGINT shutdown handler here.
// PM2 runs this app in cluster_mode and sends SIGINT to workers during
// normal operation (reloads, scale events). A handler that calls
// `pool.end()` and swallows errors leaves the pool dead while the worker
// keeps serving — causing "Cannot use a pool after calling end on the
// pool" on every subsequent request until PM2 restarts the worker.
// pg's connections are released when the OS reaps the process, which is
// fine for our use case.
