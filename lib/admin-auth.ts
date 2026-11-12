import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '@/lib/db'
import { travelAdminAllowlist } from '@/lib/db/schema'

export const ADMIN_COOKIE_NAME = 'k_travel_admin_session'
export const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12

const normalizeEmail = (value: string) => value.trim().toLowerCase()

export function getAdminEmailCandidates(): string[] {
  const envValues = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter(Boolean)

  return [...new Set(envValues)]
}

export async function getAllowedAdminEmails(): Promise<string[]> {
  const allowed = new Set(getAdminEmailCandidates())

  if (!isDatabaseConfigured) return [...allowed]

  try {
    const rows = await db.select({ email: travelAdminAllowlist.email })
      .from(travelAdminAllowlist)
      .where(eq(travelAdminAllowlist.isActive, true))

    for (const row of rows) {
      const email = normalizeEmail(row.email)
      if (email) allowed.add(email)
    }
  } catch {
    // Fall back to the configured environment allowlist when the DB is unavailable.
  }

  return [...allowed]
}

export async function isAllowedAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  const allowed = await getAllowedAdminEmails()
  return allowed.includes(normalizeEmail(email))
}

export function getAdminCookieSecret(): string {
  return process.env.NEON_AUTH_COOKIE_SECRET ?? 'development-admin-cookie-secret'
}

function encodePayload(value: string): string {
  return Buffer.from(value).toString('base64url')
}

function decodePayload(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

export function signAdminSession(email: string): string {
  const payload = JSON.stringify({
    email: normalizeEmail(email),
    exp: Date.now() + ADMIN_COOKIE_MAX_AGE_SECONDS * 1000,
  })
  const signature = createHmac('sha256', getAdminCookieSecret())
    .update(payload)
    .digest('base64url')

  return `${encodePayload(payload)}.${signature}`
}

export function verifyAdminSession(rawCookie: string | undefined): string | null {
  if (!rawCookie) return null

  const [payloadSegment, signature] = rawCookie.split('.')
  if (!payloadSegment || !signature) return null

  try {
    const payload = JSON.parse(decodePayload(payloadSegment)) as { email?: string; exp?: number }
    if (typeof payload.email !== 'string' || typeof payload.exp !== 'number') return null
    if (payload.exp <= Date.now()) return null

    const expectedSignature = createHmac('sha256', getAdminCookieSecret())
      .update(decodePayload(payloadSegment))
      .digest('base64url')

    const actual = Buffer.from(signature)
    const expected = Buffer.from(expectedSignature)
    if (actual.length !== expected.length) return null
    if (!timingSafeEqual(actual, expected)) return null

    return normalizeEmail(payload.email)
  } catch {
    return null
  }
}

export async function getCurrentAdminEmail(): Promise<string | null> {
  const store = await cookies()
  const rawCookie = store.get(ADMIN_COOKIE_NAME)?.value
  const email = verifyAdminSession(rawCookie)
  if (!email) return null

  return (await isAllowedAdminEmail(email)) ? email : null
}

export async function setAdminSession(email: string) {
  const store = await cookies()
  store.set({
    name: ADMIN_COOKIE_NAME,
    value: signAdminSession(email),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
  })
}

export async function clearAdminSession() {
  const store = await cookies()
  store.delete(ADMIN_COOKIE_NAME)
}
