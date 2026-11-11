import 'server-only'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required to use the travel database.')

type DatabaseGlobal = typeof globalThis & { travelDatabasePool?: Pool }
const globalForDatabase = globalThis as DatabaseGlobal

export const pool = globalForDatabase.travelDatabasePool ?? new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

if (process.env.NODE_ENV !== 'production') globalForDatabase.travelDatabasePool = pool

export const db = drizzle(pool, { schema })
