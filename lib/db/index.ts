import 'server-only'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
export const isDatabaseConfigured = Boolean(connectionString)

const createUnavailableDb = () => {
  const builder = {
    from: () => builder,
    where: () => builder,
    orderBy: async () => [],
    limit: async () => [],
    returning: async () => [],
    values: () => builder,
  }

  return {
    select: () => builder,
    insert: () => builder,
  } as any
}

type DatabaseGlobal = typeof globalThis & { travelDatabasePool?: Pool | null }
const globalForDatabase = globalThis as DatabaseGlobal

export const pool = connectionString
  ? (globalForDatabase.travelDatabasePool ?? new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    }))
  : null

if (process.env.NODE_ENV !== 'production' && pool) globalForDatabase.travelDatabasePool = pool

export const db = connectionString ? drizzle(pool!, { schema }) : createUnavailableDb()
