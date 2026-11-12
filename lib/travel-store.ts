import 'server-only'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { getManagedTrips } from '@/lib/admin-data'
import { db, isDatabaseConfigured } from '@/lib/db'
import { travelHotels, travelSiteContent, travelTripMedia, travelTrips } from '@/lib/db/schema'
import { trips as fallbackTrips, type TravelTrip } from '@/lib/travel-data'

type TravelTripRecord = Omit<TravelTrip, 'slug' | 'category' | 'image' | 'media' | 'hotels'>

export async function getTravelTrips(featuredOnly = false): Promise<TravelTrip[]> {
  const managedTrips = await getManagedTrips()

  if (!isDatabaseConfigured) {
    return featuredOnly ? managedTrips.slice(0, 8) : managedTrips
  }

  try {
    const rows = (await db
      .select()
      .from(travelTrips)
      .where(featuredOnly ? and(eq(travelTrips.isFeatured, true), eq(travelTrips.isPublished, true)) : eq(travelTrips.isPublished, true))
      .orderBy(asc(travelTrips.sortOrder))) as Array<{ slug: string; category: string; content: TravelTripRecord; imageUrls: string[]; isPublished: boolean; isFeatured: boolean; sortOrder: number }>

    if (!rows.length) return featuredOnly ? managedTrips.slice(0, 8) : managedTrips

    const hotels = (await db
      .select()
      .from(travelHotels)
      .where(inArray(travelHotels.tripSlug, rows.map((row: { slug: string }) => row.slug)))
      .orderBy(asc(travelHotels.sortOrder))) as Array<{ tripSlug: string; content: TravelTrip['hotels'][number]; isPublished: boolean; sortOrder: number; stars?: number | null; mealPlan?: string | null }>

    const media = (await db
      .select()
      .from(travelTripMedia)
      .where(inArray(travelTripMedia.tripSlug, rows.map((row: { slug: string }) => row.slug)))
      .orderBy(asc(travelTripMedia.sortOrder))) as Array<{ tripSlug: string; type: string; url: string; thumbnailUrl?: string | null; altText?: string | null; isPrimary?: boolean | null; sortOrder?: number | null }>

    const hotelsByTrip = new Map<string, typeof hotels>()
    for (const hotel of hotels) {
      if (!hotel.isPublished) continue
      const group = hotelsByTrip.get(hotel.tripSlug) ?? []
      group.push(hotel)
      hotelsByTrip.set(hotel.tripSlug, group)
    }

    const mediaByTrip = new Map<string, TravelTrip['media']>()
    for (const item of media) {
      const group = mediaByTrip.get(item.tripSlug) ?? []
      group.push({
        type: item.type === 'video' ? 'video' : 'image',
        url: item.url,
        thumbnail: item.thumbnailUrl ?? undefined,
        alt: item.altText ?? '',
        isPrimary: Boolean(item.isPrimary),
        sortOrder: item.sortOrder ?? undefined,
      })
      mediaByTrip.set(item.tripSlug, group)
    }

    const dbTrips = rows.map((row) => ({
      ...row.content,
      slug: row.slug,
      category: row.category as TravelTrip['category'],
      image: row.imageUrls[0] ?? '',
      media: mediaByTrip.get(row.slug) ?? [],
      hotels: (hotelsByTrip.get(row.slug) ?? []).map((hotel) => ({
        ...hotel.content,
        stars: hotel.stars ?? undefined,
        meal: hotel.mealPlan ?? undefined,
      })),
    }))

    if (featuredOnly) return dbTrips.length ? dbTrips.slice(0, 8) : managedTrips.slice(0, 8)
    return dbTrips.length ? dbTrips : managedTrips
  } catch (error) {
    console.error('[travel-store] Could not read published trips from Neon:', error)
    return featuredOnly ? managedTrips.slice(0, 8) : managedTrips
  }
}

export async function getTravelTrip(slug: string): Promise<TravelTrip | undefined> {
  const catalog = await getTravelTrips()
  return catalog.find((trip) => trip.slug === slug)
}

export async function getTravelSiteContent<T>(contentKey: string, fallback: T): Promise<T> {
  if (!isDatabaseConfigured) return fallback

  try {
    const [row] = await db
      .select({ content: travelSiteContent.content })
      .from(travelSiteContent)
      .where(eq(travelSiteContent.contentKey, contentKey))
      .limit(1)
    return (row?.content as T | undefined) ?? fallback
  } catch (error) {
    console.error(`[travel-store] Could not read site content “${contentKey}” from Neon:`, error)
    return fallback
  }
}
