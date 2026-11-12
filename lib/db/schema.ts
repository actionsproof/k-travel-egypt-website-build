import { sql } from 'drizzle-orm'
import { boolean, date, index, integer, jsonb, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { TravelHotel, TravelTrip } from '@/lib/travel-data'

export type TravelTripContent = Omit<TravelTrip, 'slug' | 'category' | 'hotels' | 'image' | 'media'>

export const travelTrips = pgTable('travel_trips', {
  slug: text('slug').primaryKey(),
  category: text('category').notNull(),
  content: jsonb('content').$type<TravelTripContent>().notNull(),
  imageUrls: jsonb('image_urls').$type<string[]>().notNull().default([]),
  sortOrder: integer('sort_order').notNull().default(0),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  validUntil: date('valid_until', { mode: 'string' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [index('travel_trips_publish_sort_idx').on(table.isPublished, table.sortOrder)])

export const travelHotels = pgTable('travel_hotels', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripSlug: text('trip_slug').notNull().references(() => travelTrips.slug, { onDelete: 'cascade' }),
  content: jsonb('content').$type<TravelHotel>().notNull().default({ ar: '', en: '' }),
  stars: smallint('stars'),
  mealPlan: text('meal_plan'),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [index('travel_hotels_trip_sort_idx').on(table.tripSlug, table.sortOrder)])

export const travelTripMedia = pgTable('travel_trip_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripSlug: text('trip_slug').notNull().references(() => travelTrips.slug, { onDelete: 'cascade' }),
  type: text('type').notNull().default('image'),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  altText: text('alt_text').notNull().default(''),
  isPrimary: boolean('is_primary').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [index('travel_trip_media_trip_sort_idx').on(table.tripSlug, table.sortOrder)])

export const travelSiteContent = pgTable('travel_site_content', {
  contentKey: text('content_key').primaryKey(),
  content: jsonb('content').notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})

export const travelFaqs = pgTable('travel_faqs', {
  id: uuid('id').primaryKey().defaultRandom(),
  locale: text('locale').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})

export const travelInquiries = pgTable('travel_inquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  tripSlug: text('trip_slug').notNull().default(''),
  hotel: text('hotel').notNull().default(''),
  adults: smallint('adults').notNull(),
  children: smallint('children').notNull().default(0),
  childAges: jsonb('child_ages').$type<number[]>().notNull().default(sql`'[]'::jsonb`),
  preferredDate: text('preferred_date').notNull().default(''),
  notes: text('notes').notNull().default(''),
  locale: text('locale').notNull().default('ar'),
  status: text('status').notNull().default('new'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => [index('travel_inquiries_status_created_idx').on(table.status, table.createdAt)])

export const travelAdminAllowlist = pgTable('travel_admin_allowlist', {
  email: text('email').primaryKey(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
})
