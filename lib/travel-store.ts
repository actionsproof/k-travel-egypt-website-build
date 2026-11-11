import 'server-only'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { travelHotels, travelSiteContent, travelTrips } from '@/lib/db/schema'
import { trips as fallbackTrips, type TravelTrip } from '@/lib/travel-data'

export async function getTravelTrips(featuredOnly = false): Promise<TravelTrip[]> {
  try {
    const rows = await db
      .select()
      .from(travelTrips)
      .where(featuredOnly ? and(eq(travelTrips.isFeatured, true), eq(travelTrips.isPublished, true)) : eq(travelTrips.isPublished, true))
      .orderBy(asc(travelTrips.sortOrder))

    if (!rows.length) return featuredOnly ? fallbackTrips.slice(0, 8) : fallbackTrips

    const hotels = await db
      .select()
      .from(travelHotels)
      .where(inArray(travelHotels.tripSlug, rows.map((row) => row.slug)))
      .orderBy(asc(travelHotels.sortOrder))

    const hotelsByTrip = new Map<string, typeof hotels>()
    for (const hotel of hotels) {
      if (!hotel.isPublished) continue
      const group = hotelsByTrip.get(hotel.tripSlug) ?? []
      group.push(hotel)
      hotelsByTrip.set(hotel.tripSlug, group)
    }

    return rows.map((row) => ({
      ...row.content,
      slug: row.slug,
      category: row.category as TravelTrip['category'],
      image: row.imageUrls[0] ?? '',
      hotels: (hotelsByTrip.get(row.slug) ?? []).map((hotel) => ({
        ...hotel.content,
        stars: hotel.stars ?? undefined,
        meal: hotel.mealPlan ?? undefined,
      })),
    }))
  } catch (error) {
    console.error('[travel-store] Could not read published trips from Neon:', error)
    return featuredOnly ? fallbackTrips.slice(0, 8) : fallbackTrips
  }
}

export async function getTravelTrip(slug: string): Promise<TravelTrip | undefined> {
  const catalog = await getTravelTrips()
  return catalog.find((trip) => trip.slug === slug)
}

export async function getTravelSiteContent<T>(contentKey: string, fallback: T): Promise<T> {
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
