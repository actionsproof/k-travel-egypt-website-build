import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { appendInquiry, getManagedTrips } from '@/lib/admin-data'
import { db, isDatabaseConfigured } from '@/lib/db'
import { travelInquiries, travelTrips } from '@/lib/db/schema'

export const runtime = 'nodejs'

const normalizeDigits = (value: string) => value.replace(/[٠-٩۰-۹]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) % 10))
const cleanText = (value: unknown, limit: number) => typeof value === 'string'
  ? value.normalize('NFKC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, limit)
  : ''

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > 16_384) return NextResponse.json({ error: 'Request too large.' }, { status: 413 })

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (cleanText(payload.website, 200)) return NextResponse.json({ ok: true }, { status: 201 })

  const name = cleanText(payload.name, 100)
  const phone = normalizeDigits(cleanText(payload.phone, 32))
  const tripSlug = cleanText(payload.tripSlug, 120)
  const hotel = cleanText(payload.hotel, 120)
  const adults = Number(normalizeDigits(String(payload.adults ?? '')))
  const children = Number(normalizeDigits(String(payload.children ?? '0')))
  const preferredDate = cleanText(payload.preferredDate, 10)
  const notes = cleanText(payload.notes, 1200)
  const locale = payload.locale === 'en' ? 'en' : 'ar'
  const agesSource = Array.isArray(payload.childAges) ? payload.childAges.join(',') : cleanText(payload.childAges, 100)
  const childAges = normalizeDigits(agesSource).match(/\d{1,2}/g)?.map(Number) ?? []

  if (name.length < 2) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 })
  if (!/^[+\d][\d\s().-]{6,30}$/.test(phone)) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 })
  if (!Number.isInteger(adults) || adults < 1 || adults > 20) return NextResponse.json({ error: 'Adults must be between 1 and 20.' }, { status: 400 })
  if (!Number.isInteger(children) || children < 0 || children > 20) return NextResponse.json({ error: 'Children must be between 0 and 20.' }, { status: 400 })
  if (childAges.some((age) => age < 0 || age > 17) || childAges.length > children) return NextResponse.json({ error: 'Please check the child ages.' }, { status: 400 })
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return NextResponse.json({ error: 'Please choose a valid preferred date.' }, { status: 400 })

  if (!isDatabaseConfigured) {
    const managedTrips = await getManagedTrips()
    if (tripSlug && !managedTrips.some((trip) => trip.slug === tripSlug)) {
      return NextResponse.json({ error: 'Please choose a published trip.' }, { status: 400 })
    }

    const inquiry = await appendInquiry({
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      phone,
      tripSlug,
      hotel,
      adults,
      children,
      preferredDate,
      notes,
      locale,
      status: 'new',
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 })
  }

  try {
    if (tripSlug) {
      const [trip] = await db.select({ slug: travelTrips.slug }).from(travelTrips)
        .where(and(eq(travelTrips.slug, tripSlug), eq(travelTrips.isPublished, true))).limit(1)
      if (!trip) return NextResponse.json({ error: 'Please choose a published trip.' }, { status: 400 })
    }

    const [inquiry] = await db.insert(travelInquiries).values({
      name,
      phone,
      tripSlug,
      hotel,
      adults,
      children,
      childAges,
      preferredDate,
      notes,
      locale,
    }).returning({ id: travelInquiries.id })

    return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 })
  } catch (error) {
    console.error('[inquiries] Could not save an inquiry:', error)
    return NextResponse.json({ error: 'We could not save your request. Please contact us on WhatsApp.' }, { status: 503 })
  }
}
