import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getManagedSiteContent, upsertManagedSiteContent } from '@/lib/admin-data'
import { isSiteContentKey, normalizeSiteContent, SITE_CONTENT_DEFAULTS, validateSiteContent } from '@/lib/site-content'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const content = Object.fromEntries(await Promise.all(
    Object.entries(SITE_CONTENT_DEFAULTS).map(async ([key, fallback]) => [
      key,
      await getManagedSiteContent(key, fallback),
    ]),
  ))
  return NextResponse.json({ content })
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  let payload: { key?: unknown; content?: unknown }
  try {
    payload = await request.json() as { key?: unknown; content?: unknown }
  } catch {
    return NextResponse.json({ error: 'Request must contain valid JSON.' }, { status: 400 })
  }

  if (typeof payload.key !== 'string' || !isSiteContentKey(payload.key)) {
    return NextResponse.json({ error: 'Unsupported site content section.' }, { status: 400 })
  }
  if (!validateSiteContent(payload.key, payload.content)) {
    return NextResponse.json({ error: 'Content shape is invalid. Check the required fields and value types.' }, { status: 400 })
  }

  const content = normalizeSiteContent(payload.key, payload.content)
  await upsertManagedSiteContent(payload.key, content)
  return NextResponse.json({ ok: true, content })
}
