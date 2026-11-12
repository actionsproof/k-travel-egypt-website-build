import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { listInquiries } from '@/lib/admin-data'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  return NextResponse.json({ inquiries: await listInquiries() })
}
