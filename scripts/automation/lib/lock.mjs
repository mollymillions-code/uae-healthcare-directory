/**
 * File-based lock to prevent concurrent automation runs.
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { CONFIG } from './config.mjs';

function lockPath(mode) {
  return join(CONFIG.locks.dir, `zavis-auto-${mode}.lock`);
}

function maxAge(mode) {
  const ages = {
    weekly: CONFIG.locks.weeklyMaxAge,
    daily: CONFIG.locks.dailyMaxAge,
    review: CONFIG.locks.reviewMaxAge,
    health: 10 * 60 * 1000, // 10 min
  };
  return ages[mode] || CONFIG.locks.dailyMaxAge;
}

/**
 * Acquire lock. Returns true if acquired, false if another run is active.
 * Stale locks (older than maxAge) are auto-cleared with a warning.
 */
export function acquireLock(mode) {
  const path = lockPath(mode);

  if (existsSync(path)) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'));
      const age = Date.now() - data.timestamp;

      if (age > maxAge(mode)) {
        console.warn(`Stale lock detected (${(age / 1000 / 60).toFixed(1)} min old). Clearing.`);
        unlinkSync(path);
      } else {
        console.error(`Lock held by PID ${data.pid} (started ${new Date(data.timestamp).toISOString()})`);
        return false;
      }
    } catch {
      // Corrupted lock file — clear it
      unlinkSync(path);
    }
  }

  writeFileSync(path, JSON.stringify({
    pid: process.pid,
    timestamp: Date.now(),
    mode,
  }));

  return true;
}

/**
 * Release lock.
 */
export function releaseLock(mode) {
  const path = lockPath(mode);
  try {
    if (existsSync(path)) unlinkSync(path);
  } catch { /* ignore */ }
}

/**
 * Check if a lock exists (without acquiring).
 */
export function isLocked(mode) {
  const path = lockPath(mode);
  if (!existsSync(path)) return false;

  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const age = Date.now() - data.timestamp;
    return age < maxAge(mode);
  } catch {
    return false;
  }
}
