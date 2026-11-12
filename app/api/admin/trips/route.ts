import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { normalizeAdminTrip } from '@/lib/admin-trip-form'
import { getManagedTrips, upsertAdminTrip } from '@/lib/admin-data'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  return NextResponse.json({ trips: await getManagedTrips() })
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const formData = await request.formData()
  const trip = normalizeAdminTrip(formData)
  await upsertAdminTrip(trip)
  return NextResponse.redirect(new URL('/admin', request.url))
}
