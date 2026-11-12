import { NextResponse } from 'next/server'
import { deleteAdminTrip, getManagedTrips, upsertAdminTrip } from '@/lib/admin-data'
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

async function normalizeTrip(payload: FormData, existingSlug: string): Promise<TravelTrip> {
  const slug = toText(payload.get('slug'), existingSlug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || existingSlug || 'new-trip'
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
  const coverImage = (coverFileValue instanceof File && coverFileValue.size > 0)
    ? (await saveUploadedFiles([coverFileValue], 'image'))[0]
    : toText(payload.get('coverImage'), toText(payload.get('image'), 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=85'))

  const imageUrls = [
    ...parseTextMediaUrls(toText(payload.get('galleryImages')), 'image'),
    ...uploadedUrls.filter((url) => !/\.(mp4|mov|webm)(\?.*)?$/i.test(url)),
  ]
  const videoUrls = [
    ...parseTextMediaUrls(toText(payload.get('galleryVideos')), 'video'),
    ...uploadedUrls.filter((url) => /\.(mp4|mov|webm)(\?.*)?$/i.test(url)),
  ]

  const media: TravelMedia[] = [
    {
      type: 'image',
      url: coverImage,
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
    image: coverImage,
    media,
    tag,
    summary,
    hotels: [],
    includes: [toLocalized(toText(payload.get('includeEn')), toText(payload.get('includeAr')))],
    excludes: [toLocalized(toText(payload.get('excludeEn')), toText(payload.get('excludeAr')))],
    notes: [toLocalized(toText(payload.get('noteEn')), toText(payload.get('noteAr')))],
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trips = await getManagedTrips()
  const trip = trips.find((item) => item.slug === slug)
  if (!trip) return NextResponse.json({ error: 'Trip not found.' }, { status: 404 })
  return NextResponse.json({ trip })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const formData = await request.formData()
  const method = String(formData.get('_method') ?? '').toUpperCase()

  if (method === 'DELETE') {
    await deleteAdminTrip(slug)
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const trip = await normalizeTrip(formData, slug)
  await upsertAdminTrip(trip)
  return NextResponse.redirect(new URL('/admin', request.url))
}
