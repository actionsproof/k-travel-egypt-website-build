import { promises as fs } from 'node:fs'
import path from 'node:path'
import { asc, eq, inArray } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '@/lib/db'
import { travelHotels, travelInquiries, travelTripMedia, travelTrips } from '@/lib/db/schema'
import { trips as fallbackTrips, type TravelTrip } from '@/lib/travel-data'

export type AdminInquiryStatus = 'new' | 'contacted' | 'closed'

export type AdminInquiry = {
  id: string
  name: string
  phone: string
  tripSlug: string
  hotel: string
  adults: number
  children: number
  preferredDate: string
  notes: string
  locale: 'ar' | 'en'
  status: AdminInquiryStatus
  createdAt: string
}

export type AdminStore = {
  trips: TravelTrip[]
  inquiries: AdminInquiry[]
}

const storePath = path.join(process.cwd(), 'data', 'admin-store.json')

function requirePersistentStorage(): void {
  if (process.env.NODE_ENV === 'production' && !isDatabaseConfigured) {
    throw new Error('DATABASE_URL must be configured before production admin data can be changed.')
  }
}

function createDefaultStore(): AdminStore {
  return { trips: [], inquiries: [] }
}

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(path.dirname(storePath), { recursive: true })
  try {
    await fs.access(storePath)
  } catch {
    await fs.writeFile(storePath, JSON.stringify(createDefaultStore(), null, 2), 'utf8')
  }
}

export async function readAdminStore(): Promise<AdminStore> {
  await ensureStoreFile()

  try {
    const file = await fs.readFile(storePath, 'utf8')
    const parsed = JSON.parse(file) as Partial<AdminStore>
    return {
      trips: Array.isArray(parsed.trips) ? parsed.trips as TravelTrip[] : [],
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries as AdminInquiry[] : [],
    }
  } catch {
    return createDefaultStore()
  }
}

export async function writeAdminStore(store: AdminStore): Promise<void> {
  await ensureStoreFile()
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf8')
}

function toDbTripPayload(trip: TravelTrip) {
  const { slug, category, hotels, image, media, ...content } = trip
  return {
    slug,
    category,
    content,
    imageUrls: Array.from(new Set([image, ...(media ?? []).map((entry) => entry.url).filter(Boolean)])),
    media: (media ?? []).map((entry) => ({
      type: entry.type,
      url: entry.url,
      thumbnail: entry.thumbnail ?? undefined,
      alt: entry.alt ?? '',
      isPrimary: Boolean(entry.isPrimary),
      sortOrder: entry.sortOrder ?? 0,
    })),
  }
}

export async function getManagedTrips(): Promise<TravelTrip[]> {
  if (isDatabaseConfigured) {
    try {
      const rows: Array<{ slug: string; category: string; content: Record<string, unknown>; imageUrls: string[] }> = await db.select().from(travelTrips).orderBy(asc(travelTrips.sortOrder))
      if (!rows.length) return fallbackTrips

      const mediaRows: Array<{ tripSlug: string; type: string; url: string; thumbnailUrl?: string | null; altText?: string | null; isPrimary?: boolean | null; sortOrder?: number | null }> = await db.select().from(travelTripMedia)
        .where(inArray(travelTripMedia.tripSlug, rows.map((row) => row.slug)))
        .orderBy(asc(travelTripMedia.sortOrder))

      const mediaByTrip = new Map<string, TravelTrip['media']>()
      for (const media of mediaRows) {
        const group = mediaByTrip.get(media.tripSlug) ?? []
        group.push({
          type: media.type === 'video' ? 'video' : 'image',
          url: media.url,
          thumbnail: media.thumbnailUrl ?? undefined,
          alt: media.altText ?? '',
          isPrimary: Boolean(media.isPrimary),
          sortOrder: media.sortOrder ?? undefined,
        })
        mediaByTrip.set(media.tripSlug, group)
      }

      return rows.map((row) => ({
        ...(row.content as Partial<TravelTrip>),
        slug: row.slug,
        category: row.category as TravelTrip['category'],
        image: row.imageUrls[0] ?? '',
        media: mediaByTrip.get(row.slug) ?? [],
        hotels: [],
      } as TravelTrip))
    } catch (error) {
      console.error('[admin-data] Could not read trips from database; falling back to local store.', error)
    }
  }

  const store = await readAdminStore()
  const merged = new Map<string, TravelTrip>()

  for (const trip of fallbackTrips) merged.set(trip.slug, trip)
  for (const trip of store.trips) merged.set(trip.slug, trip)
  return [...merged.values()]
}

export async function upsertAdminTrip(trip: TravelTrip): Promise<TravelTrip> {
  requirePersistentStorage()

  if (isDatabaseConfigured) {
    const payload = toDbTripPayload(trip)
    await db.transaction(async (transaction) => {
      await transaction.insert(travelTrips)
        .values({
          slug: payload.slug,
          category: payload.category,
          content: payload.content,
          imageUrls: payload.imageUrls,
          sortOrder: 0,
          isFeatured: false,
          isPublished: true,
        })
        .onConflictDoUpdate({
          target: travelTrips.slug,
          set: {
            category: payload.category,
            content: payload.content,
            imageUrls: payload.imageUrls,
            updatedAt: new Date(),
          },
        })

      await transaction.delete(travelTripMedia).where(eq(travelTripMedia.tripSlug, payload.slug))
      if (payload.media.length) {
        await transaction.insert(travelTripMedia).values(payload.media.map((media, index) => ({
          tripSlug: payload.slug,
          type: media.type,
          url: media.url,
          thumbnailUrl: media.thumbnail ?? null,
          altText: media.alt ?? '',
          isPrimary: Boolean(media.isPrimary || index === 0),
          sortOrder: index,
        })))
      }
    })
    return trip
  }

  const store = await readAdminStore()
  const index = store.trips.findIndex((item) => item.slug === trip.slug)
  if (index >= 0) store.trips[index] = trip
  else store.trips.push(trip)
  await writeAdminStore(store)
  return trip
}

export async function deleteAdminTrip(slug: string): Promise<void> {
  requirePersistentStorage()

  if (isDatabaseConfigured) {
    await db.transaction(async (transaction) => {
      await transaction.delete(travelTripMedia).where(eq(travelTripMedia.tripSlug, slug))
      await transaction.delete(travelHotels).where(eq(travelHotels.tripSlug, slug))
      await transaction.delete(travelTrips).where(eq(travelTrips.slug, slug))
    })
    return
  }

  const store = await readAdminStore()
  store.trips = store.trips.filter((trip) => trip.slug !== slug)
  await writeAdminStore(store)
}

export async function appendInquiry(inquiry: AdminInquiry): Promise<AdminInquiry> {
  requirePersistentStorage()

  if (isDatabaseConfigured) {
    const [row]: Array<{ id: string }> = await db.insert(travelInquiries).values({
      name: inquiry.name,
      phone: inquiry.phone,
      tripSlug: inquiry.tripSlug,
      hotel: inquiry.hotel,
      adults: inquiry.adults,
      children: inquiry.children,
      preferredDate: inquiry.preferredDate,
      notes: inquiry.notes,
      locale: inquiry.locale,
      status: inquiry.status,
    }).returning({ id: travelInquiries.id })
    return { ...inquiry, id: row.id }
  }

  const store = await readAdminStore()
  store.inquiries = [inquiry, ...store.inquiries]
  await writeAdminStore(store)
  return inquiry
}

export async function listInquiries(): Promise<AdminInquiry[]> {
  if (isDatabaseConfigured) {
    const rows: Array<{ id: string; name: string; phone: string; tripSlug: string; hotel: string; adults: number | string; children: number | string; preferredDate: string; notes: string; locale: string; status: string; createdAt?: Date | string | null }> = await db.select().from(travelInquiries).orderBy(travelInquiries.createdAt)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      tripSlug: row.tripSlug,
      hotel: row.hotel,
      adults: Number(row.adults),
      children: Number(row.children),
      preferredDate: row.preferredDate,
      notes: row.notes,
      locale: (row.locale === 'en' ? 'en' : 'ar') as AdminInquiry['locale'],
      status: row.status as AdminInquiryStatus,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    } as AdminInquiry)).reverse()
  }

  const store = await readAdminStore()
  return [...store.inquiries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function updateInquiryStatus(id: string, status: AdminInquiryStatus): Promise<AdminInquiry | null> {
  requirePersistentStorage()

  if (isDatabaseConfigured) {
    const [row]: Array<{ id: string; name: string; phone: string; tripSlug: string; hotel: string; adults: number | string; children: number | string; preferredDate: string; notes: string; locale: string; status: string; createdAt?: Date | string | null }> = await db.update(travelInquiries)
      .set({ status })
      .where(eq(travelInquiries.id, id))
      .returning()
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      tripSlug: row.tripSlug,
      hotel: row.hotel,
      adults: Number(row.adults),
      children: Number(row.children),
      preferredDate: row.preferredDate,
      notes: row.notes,
      locale: (row.locale === 'en' ? 'en' : 'ar') as AdminInquiry['locale'],
      status: row.status as AdminInquiryStatus,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    } as AdminInquiry
  }

  const store = await readAdminStore()
  const inquiry = store.inquiries.find((item) => item.id === id)
  if (!inquiry) return null

  inquiry.status = status
  await writeAdminStore(store)
  return inquiry
}
