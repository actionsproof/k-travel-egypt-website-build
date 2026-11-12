import { parseTextMediaUrls, toText } from '@/lib/media-upload'
import type { Localized, TravelMedia, TravelTrip } from '@/lib/travel-data'

const tripCategories = ['umrah', 'honeymoon', 'international', 'domestic'] as const
const defaultCover = 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=85'

function localizedValue(payload: FormData, name: string, fallback?: Localized): Localized {
  return {
    en: toText(payload.get(`${name}En`), fallback?.en ?? ''),
    ar: toText(payload.get(`${name}Ar`), fallback?.ar ?? ''),
  }
}

function mediaUrls(payload: FormData, field: string, uploadedField: string, existing: TravelMedia[], type: TravelMedia['type']): string[] {
  const raw = payload.get(field)
  const baseUrls = typeof raw === 'string'
    ? parseTextMediaUrls(raw)
    : existing.filter((item) => item.type === type && !item.isPrimary).map((item) => item.url)
  const uploadedUrls = payload.getAll(uploadedField).flatMap((value) => typeof value === 'string' ? parseTextMediaUrls(value) : [])

  return [...new Set([...baseUrls, ...uploadedUrls])]
}

type TripDetails = Pick<TravelTrip, 'dates' | 'hotels' | 'flights' | 'itinerary' | 'visa' | 'terms' | 'notes' | 'includes' | 'excludes'>

function isLocalized(value: unknown): value is Localized {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)
    && 'en' in value && typeof value.en === 'string'
    && 'ar' in value && typeof value.ar === 'string')
}

function parseTripDetails(payload: FormData, existing?: TravelTrip): TripDetails {
  const raw = payload.get('tripDetailsJson')
  if (typeof raw !== 'string' || !raw.trim()) {
    return {
      dates: existing?.dates,
      hotels: existing?.hotels ?? [],
      flights: existing?.flights,
      itinerary: existing?.itinerary,
      visa: existing?.visa,
      terms: existing?.terms,
      notes: existing?.notes,
      includes: existing?.includes ?? [],
      excludes: existing?.excludes ?? [],
    }
  }

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch (error) {
    throw new Error(`Trip details must be valid JSON: ${error instanceof Error ? error.message : 'invalid JSON'}`)
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Trip details must be a JSON object.')
  }

  const details = value as Record<string, unknown>
  const localizedOptional = (key: 'dates' | 'visa', fallback?: Localized) => {
    const field = details[key]
    if (field === undefined) return fallback
    if (field === null) return undefined
    if (!isLocalized(field)) throw new Error(`${key} must be null or an object with en and ar strings.`)
    return field
  }
  const localizedArray = (key: 'includes' | 'excludes' | 'flights' | 'terms' | 'notes', fallback: Localized[] = []) => {
    const field = details[key]
    if (field === undefined) return fallback
    if (!Array.isArray(field) || !field.every(isLocalized)) {
      throw new Error(`${key} must be an array of objects with en and ar strings.`)
    }
    return field
  }
  const hotels = details.hotels === undefined ? existing?.hotels ?? [] : details.hotels
  if (!Array.isArray(hotels) || !hotels.every((hotel) => {
    if (!hotel || typeof hotel !== 'object' || Array.isArray(hotel) || !isLocalized(hotel)) return false
    const item = hotel as Record<string, unknown>
    return (item.stars === undefined || (typeof item.stars === 'number' && Number.isInteger(item.stars) && item.stars >= 1 && item.stars <= 5))
      && (item.meal === undefined || typeof item.meal === 'string')
      && (item.location === undefined || isLocalized(item.location))
      && (item.distance === undefined || isLocalized(item.distance))
      && (item.note === undefined || isLocalized(item.note))
  })) {
    throw new Error('hotels must be an array of bilingual hotel records with valid optional details.')
  }

  const itinerary = details.itinerary === undefined ? existing?.itinerary ?? [] : details.itinerary
  if (!Array.isArray(itinerary) || !itinerary.every((entry) => Boolean(entry && typeof entry === 'object'
    && isLocalized((entry as { day?: unknown }).day)
    && isLocalized((entry as { detail?: unknown }).detail)))) {
    throw new Error('itinerary must be an array of objects with bilingual day and detail fields.')
  }

  return {
    dates: localizedOptional('dates', existing?.dates),
    hotels: hotels as TravelTrip['hotels'],
    flights: localizedArray('flights', existing?.flights ?? []),
    itinerary: itinerary as TravelTrip['itinerary'],
    visa: localizedOptional('visa', existing?.visa),
    terms: localizedArray('terms', existing?.terms ?? []),
    notes: localizedArray('notes', existing?.notes ?? []),
    includes: localizedArray('includes', existing?.includes ?? []),
    excludes: localizedArray('excludes', existing?.excludes ?? []),
  }
}

export function normalizeAdminTrip(payload: FormData, existing?: TravelTrip): TravelTrip {
  const slugInput = toText(payload.get('slug'), 'new-trip')
  const slug = existing?.slug ?? (slugInput.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'new-trip')
  const categoryValue = toText(payload.get('category'), existing?.category ?? 'international')
  const category = tripCategories.includes(categoryValue as typeof tripCategories[number])
    ? categoryValue as TravelTrip['category']
    : existing?.category ?? 'international'
  const fallbackMedia = existing?.media ?? []
  const coverImage = toText(payload.get('coverImage')) || toText(payload.get('image'), existing?.image ?? defaultCover)
  const galleryImages = mediaUrls(payload, 'galleryImages', 'uploadedImages', fallbackMedia, 'image')
  const galleryVideos = mediaUrls(payload, 'galleryVideos', 'uploadedVideos', fallbackMedia, 'video')
  const details = parseTripDetails(payload, existing)

  const media: TravelMedia[] = [
    { type: 'image', url: coverImage, alt: 'Cover image', isPrimary: true, sortOrder: 0 },
    ...galleryImages.map((url, index) => ({ type: 'image' as const, url, alt: `Image ${index + 1}`, sortOrder: index + 1 })),
    ...galleryVideos.map((url, index) => ({ type: 'video' as const, url, alt: `Video ${index + 1}`, sortOrder: galleryImages.length + index + 1 })),
  ]

  return {
    slug,
    category,
    title: localizedValue(payload, 'title', existing?.title),
    destination: localizedValue(payload, 'destination', existing?.destination),
    duration: localizedValue(payload, 'duration', existing?.duration),
    dates: details.dates,
    image: coverImage,
    media,
    tag: localizedValue(payload, 'tag', existing?.tag),
    summary: localizedValue(payload, 'summary', existing?.summary),
    hotels: details.hotels,
    flights: details.flights,
    includes: payload.has('tripDetailsJson') ? details.includes : payload.has('includeEn') || payload.has('includeAr')
      ? [localizedValue(payload, 'include')]
      : existing?.includes ?? [],
    excludes: payload.has('tripDetailsJson') ? details.excludes : payload.has('excludeEn') || payload.has('excludeAr')
      ? [localizedValue(payload, 'exclude')]
      : existing?.excludes ?? [],
    itinerary: details.itinerary,
    visa: details.visa,
    terms: details.terms,
    notes: payload.has('tripDetailsJson') ? details.notes : payload.has('noteEn') || payload.has('noteAr')
      ? [localizedValue(payload, 'note')]
      : existing?.notes ?? [],
  }
}
