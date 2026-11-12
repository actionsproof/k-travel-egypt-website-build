CREATE TABLE IF NOT EXISTS travel_trips (
  slug TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  content JSONB NOT NULL,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_slug TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  stars SMALLINT,
  meal_plan TEXT,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_trip_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_slug TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT NOT NULL DEFAULT '',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_site_content (
  content_key TEXT PRIMARY KEY,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  trip_slug TEXT NOT NULL DEFAULT '',
  hotel TEXT NOT NULL DEFAULT '',
  adults SMALLINT NOT NULL,
  children SMALLINT NOT NULL DEFAULT 0,
  child_ages JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  locale TEXT NOT NULL DEFAULT 'ar',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS travel_admin_allowlist (
  email TEXT PRIMARY KEY,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS travel_trips_publish_sort_idx ON travel_trips (is_published, sort_order);
CREATE INDEX IF NOT EXISTS travel_hotels_trip_sort_idx ON travel_hotels (trip_slug, sort_order);
CREATE INDEX IF NOT EXISTS travel_trip_media_trip_sort_idx ON travel_trip_media (trip_slug, sort_order);
CREATE INDEX IF NOT EXISTS travel_inquiries_status_created_idx ON travel_inquiries (status, created_at);
