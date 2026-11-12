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
    dates: existing?.dates,
    image: coverImage,
    media,
    tag: localizedValue(payload, 'tag', existing?.tag),
    summary: localizedValue(payload, 'summary', existing?.summary),
    hotels: existing?.hotels ?? [],
    flights: existing?.flights,
    includes: payload.has('includeEn') || payload.has('includeAr')
      ? [localizedValue(payload, 'include')]
      : existing?.includes ?? [],
    excludes: payload.has('excludeEn') || payload.has('excludeAr')
      ? [localizedValue(payload, 'exclude')]
      : existing?.excludes ?? [],
    itinerary: existing?.itinerary,
    visa: existing?.visa,
    terms: existing?.terms,
    notes: payload.has('noteEn') || payload.has('noteAr')
      ? [localizedValue(payload, 'note')]
      : existing?.notes ?? [],
  }
}
