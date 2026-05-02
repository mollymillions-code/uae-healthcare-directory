/**
 * safe() — wrap any DB call with a graceful fallback so local schema drift
 * or pool exhaustion can't 500 an entire page. Logs in dev only.
 */
export async function safe<T>(p: Promise<T>, fallback: T, label?: string): Promise<T> {
  try {
    return await p;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[safeData${label ? ":" + label : ""}] falling back:`, msg);
    }
    return fallback;
  }
}

/** safeAll — Promise.all with the same safety guarantee per-promise. */
export async function safeAll<T>(promises: Promise<T>[], fallbackPerItem: T, label?: string): Promise<T[]> {
  return Promise.all(promises.map((p) => safe(p, fallbackPerItem, label)));
}
