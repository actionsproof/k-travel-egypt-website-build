import { NextResponse } from 'next/server'
import { getCurrentAdminEmail } from '@/lib/admin-auth'

export async function requireAdminApi(): Promise<NextResponse | null> {
  const email = await getCurrentAdminEmail()
  if (email) return null

  return NextResponse.json({ error: 'You must be signed in as an admin.' }, { status: 401 })
}
