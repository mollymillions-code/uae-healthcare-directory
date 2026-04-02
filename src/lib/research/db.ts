import { Pool, QueryResult } from 'pg'

let _pool: Pool | null = null

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }
  return _pool
}

export function getDb() {
  const pool = getPool()
  return async (strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult['rows']> => {
    const text = strings.reduce((prev, curr, i) => prev + '$' + i + curr)
    const result = await pool.query(text, values)
    return result.rows
  }
}

// Graceful shutdown — close pool on process termination
if (typeof process !== "undefined") {
  const shutdown = () => { _pool?.end().catch(() => {}); };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
