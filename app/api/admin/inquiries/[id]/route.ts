import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { updateInquiryStatus } from '@/lib/admin-data'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { id } = await params
  const formData = await request.formData()
  const status = String(formData.get('status') ?? 'new')

  const updated = await updateInquiryStatus(id, status === 'contacted' || status === 'closed' ? status : 'new')
  if (!updated) {
    return NextResponse.json({ error: 'Inquiry not found.' }, { status: 404 })
  }

  return NextResponse.redirect(new URL('/admin', request.url))
}
