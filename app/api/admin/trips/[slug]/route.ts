import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { normalizeAdminTrip } from '@/lib/admin-trip-form'
import { deleteAdminTrip, getManagedTrips, upsertAdminTrip } from '@/lib/admin-data'

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { slug } = await params
  const trips = await getManagedTrips()
  const trip = trips.find((item) => item.slug === slug)
  if (!trip) return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  return NextResponse.json({ trip })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { slug } = await params
  const formData = await request.formData()
  const method = String(formData.get('_method') ?? '').toUpperCase()

  if (method === 'DELETE') {
    await deleteAdminTrip(slug)
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const existing = (await getManagedTrips()).find((item) => item.slug === slug)
  if (!existing) return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })

  let trip
  try {
    trip = normalizeAdminTrip(formData, existing)
  } catch (error) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 })
    throw error
  }
  await upsertAdminTrip(trip)
  return NextResponse.redirect(new URL('/admin', request.url))
}
