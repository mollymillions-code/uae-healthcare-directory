import { neon, NeonQueryFunction } from '@neondatabase/serverless'

let _sql: NeonQueryFunction<false, false> | null = null

export function getDb(): NeonQueryFunction<false, false> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}
