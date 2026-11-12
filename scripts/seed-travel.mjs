import { createHash } from 'node:crypto'
import { Pool } from 'pg'
import { branches, categories, faqs, generalTerms, mealPlans, travelImages, trips, visaGuides, whatsappContacts } from '../lib/travel-data.ts'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required to seed the travel catalog.')

const pool = new Pool({ connectionString: databaseUrl, max: 1 })
const deterministicUuid = (value) => {
  const bytes = createHash('sha1').update(value).digest().subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const client = await pool.connect()
try {
  await client.query('BEGIN')

  for (const [sortOrder, trip] of trips.entries()) {
    const { slug, category, hotels, image, ...content } = trip
    await client.query(
      `INSERT INTO public.travel_trips (slug, category, content, image_urls, sort_order, is_featured, is_published)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, true)
       ON CONFLICT (slug) DO NOTHING`,
      [slug, category, JSON.stringify(content), JSON.stringify([image]), sortOrder, sortOrder < 8],
    )

    for (const [hotelOrder, hotel] of hotels.entries()) {
      await client.query(
        `INSERT INTO public.travel_hotels (id, trip_slug, content, stars, meal_plan, sort_order, is_published)
         VALUES ($1::uuid, $2, $3::jsonb, $4, $5, $6, true)
         ON CONFLICT (id) DO NOTHING`,
        [deterministicUuid(`${slug}:hotel:${hotelOrder}`), slug, JSON.stringify(hotel), hotel.stars ?? null, hotel.meal ?? null, hotelOrder],
      )
    }
  }

  for (const [sortOrder, faq] of faqs.entries()) {
    for (const locale of ['ar', 'en']) {
      await client.query(
        `INSERT INTO public.travel_faqs (id, locale, question, answer, sort_order, is_published)
         VALUES ($1::uuid, $2, $3, $4, $5, true)
         ON CONFLICT (id) DO NOTHING`,
        [deterministicUuid(`faq:${locale}:${sortOrder}`), locale, faq.question[locale], faq.answer[locale], sortOrder],
      )
    }
  }

  const siteContent = {
    company: {
      name: 'K Egypt Travel',
      tagline: { ar: 'رحلتك في رعايتنا', en: 'Your Journey, Our Care' },
      licenseCategory: 'A',
      licenseNumber: '2469',
      taxCard: '445-773-523',
      workingHours: { ar: 'يومياً من ١٠ صباحاً إلى ١٠ مساءً', en: 'Daily, 10 AM–10 PM' },
    },
    branches,
    whatsappContacts,
    categories,
    faqs,
    visaGuides,
    generalTerms,
    mealPlans,
    travelImages,
  }

  for (const [contentKey, content] of Object.entries(siteContent)) {
    await client.query(
      `INSERT INTO public.travel_site_content (content_key, content)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (content_key) DO NOTHING`,
      [contentKey, JSON.stringify(content)],
    )
  }

  await client.query('COMMIT')
  console.log(`Seeded ${trips.length} trips, ${trips.reduce((count, trip) => count + trip.hotels.length, 0)} hotel options, ${faqs.length * 2} localized FAQs, and ${Object.keys(siteContent).length} site content records.`)
} catch (error) {
  await client.query('ROLLBACK')
  throw error
} finally {
  client.release()
  await pool.end()
}
