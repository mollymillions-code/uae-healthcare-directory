import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Pool sizing math (re-derived after QA Round 4 pool fix blew up the build
// with "too many clients already" at 2026-04-11 10:21 UTC):
//
// - PostgreSQL on EC2 has max_connections = 100
// - At rest we observed ~40-60 active+idle connections across everything
//   (PM2 runtime workers + psql sessions + background scripts)
// - That leaves ~40-60 connections of headroom in steady state
// - BUT `next build` spawns ~6-8 static-render workers in parallel, each
//   importing this module and creating its own Pool. With `max: 30` each,
//   that's ~240 potential slots — overwhelmingly over budget.
//
// Safe per-process cap during next build:
//   max=12. Build phase: ~8 workers × 12 = 96 (safely under 100).
// Runtime can run higher because PM2 steady state is two web workers. Crawlers
// can burst over the old 25-connection cap per worker and trigger pg's pool
// acquisition timeout even while PostgreSQL itself still has capacity, so keep
// the runtime cap and wait timeout tunable from env.
const BUILD_POOL_MAX = 12;
const DEFAULT_RUNTIME_POOL_MAX = 40;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const isNextBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";

const configuredPoolMax = parsePositiveInteger(
  process.env.DB_POOL_MAX,
  DEFAULT_RUNTIME_POOL_MAX
);
const poolMax = isNextBuild
  ? Math.min(configuredPoolMax, BUILD_POOL_MAX)
  : configuredPoolMax;
const poolMin = Math.min(
  parsePositiveInteger(process.env.DB_POOL_MIN, 2),
  poolMax
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: poolMax,
  min: poolMin,
  // Short idleTimeoutMillis reclaims connections after 30s of idle so we
  // don't hold 12 open forever when traffic dips.
  idleTimeoutMillis: 30000,
  // Crawl bursts can briefly consume every runtime client. Queue longer before
  // surfacing a 500, while still failing quickly when the DB is truly down.
  connectionTimeoutMillis: parsePositiveInteger(process.env.DB_POOL_CONNECT_TIMEOUT_MS, 30000),
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
