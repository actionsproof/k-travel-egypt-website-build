import { NextResponse } from 'next/server'
import { getManagedTrips, upsertAdminTrip } from '@/lib/admin-data'
import { parseTextMediaUrls, saveUploadedFiles, toText } from '@/lib/media-upload'
import type { TravelMedia, TravelTrip } from '@/lib/travel-data'

const tripCategories = ['umrah', 'honeymoon', 'international', 'domestic'] as const
const toLocalized = (en: string, ar: string) => ({ en, ar })

const parseMediaList = (entries: string[], type: 'image' | 'video'): TravelMedia[] =>
  entries.map((url, index) => ({
    type,
    url,
    alt: `${type} asset ${index + 1}`,
    isPrimary: index === 0,
    sortOrder: index,
  }))

async function normalizeTrip(payload: FormData): Promise<TravelTrip> {
  const slug = toText(payload.get('slug'), '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'new-trip'
  const categoryValue = toText(payload.get('category'))
  const category = tripCategories.includes(categoryValue as typeof tripCategories[number]) ? (categoryValue as typeof tripCategories[number]) : 'international'

  const title = toLocalized(toText(payload.get('titleEn')), toText(payload.get('titleAr')))
  const destination = toLocalized(toText(payload.get('destinationEn')), toText(payload.get('destinationAr')))
  const duration = toLocalized(toText(payload.get('durationEn')), toText(payload.get('durationAr')))
  const tag = toLocalized(toText(payload.get('tagEn')), toText(payload.get('tagAr')))
  const summary = toLocalized(toText(payload.get('summaryEn')), toText(payload.get('summaryAr')))

  const uploadedMediaFiles = payload.getAll('mediaFiles').filter((value): value is File => value instanceof File && value.size > 0)
  const uploadedUrls = await saveUploadedFiles(uploadedMediaFiles)

  const coverFileValue = payload.get('coverFile')
  const coverUrl = (coverFileValue instanceof File && coverFileValue.size > 0)
    ? (await saveUploadedFiles([coverFileValue], 'image'))[0]
    : toText(payload.get('coverImage'), toText(payload.get('image'), 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=85'))

  const imageUrls = [
    ...parseTextMediaUrls(toText(payload.get('galleryImages')), 'image'),
    ...uploadedUrls.filter((url) => !url.endsWith('.mp4') && !url.endsWith('.mov') && !url.endsWith('.webm')),
  ]
  const videoUrls = [
    ...parseTextMediaUrls(toText(payload.get('galleryVideos')), 'video'),
    ...uploadedUrls.filter((url) => url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm')),
  ]

  const media: TravelMedia[] = [
    {
      type: 'image',
      url: coverUrl,
      alt: 'Cover image',
      isPrimary: true,
      sortOrder: 0,
    },
    ...parseMediaList(imageUrls, 'image'),
    ...parseMediaList(videoUrls, 'video'),
  ]

  return {
    slug,
    category,
    title,
    destination,
    duration,
    image: coverUrl,
    media,
    tag,
    summary,
    hotels: [],
    includes: [toLocalized(toText(payload.get('includeEn')), toText(payload.get('includeAr')))],
    excludes: [toLocalized(toText(payload.get('excludeEn')), toText(payload.get('excludeAr')))],
    notes: [toLocalized(toText(payload.get('noteEn')), toText(payload.get('noteAr')))],
  }
}

export async function GET() {
  return NextResponse.json({ trips: await getManagedTrips() })
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const trip = await normalizeTrip(formData)
  await upsertAdminTrip(trip)
  return NextResponse.redirect(new URL('/admin', request.url))
}
