import { Pool, QueryResult } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

function createSql(pool: Pool) {
  return async (strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]> => {
    let text = "";
    for (let i = 0; i < strings.length; i++) {
      text += strings[i];
      if (i < values.length) text += `$${i + 1}`;
    }
    const result: QueryResult = await pool.query(text, values);
    return result.rows;
  };
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const sql = createSql(pool);

  await sql`
    CREATE TABLE IF NOT EXISTS journal_articles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      tags JSONB DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'original',
      source_url TEXT,
      source_name TEXT,
      author_name TEXT NOT NULL DEFAULT 'Journal Staff',
      author_role TEXT,
      image_url TEXT,
      image_caption TEXT,
      is_featured BOOLEAN DEFAULT false,
      is_breaking BOOLEAN DEFAULT false,
      read_time_minutes INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'published',
      published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_journal_category ON journal_articles(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_journal_status ON journal_articles(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_journal_published ON journal_articles(published_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_journal_featured ON journal_articles(is_featured)`;

  console.log("journal_articles table created successfully");

  const count = await sql`SELECT COUNT(*) FROM journal_articles`;
  console.log("Current row count:", count[0].count);

  await pool.end();
}

main().catch(console.error);
