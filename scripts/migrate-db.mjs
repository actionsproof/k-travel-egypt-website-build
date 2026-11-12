import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required. Add your Neon Postgres connection string before running migrations.')
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const migration = await readFile(path.join(scriptDir, 'init-db.sql'), 'utf8')
const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10_000,
})

let client
try {
  client = await pool.connect()
  await client.query('BEGIN')
  await client.query(migration)
  await client.query('COMMIT')
  console.log('Database schema is ready.')
} catch (error) {
  if (client) await client.query('ROLLBACK')
  console.error('Database migration failed:', error)
  process.exitCode = 1
} finally {
  client?.release()
  await pool.end()
}
