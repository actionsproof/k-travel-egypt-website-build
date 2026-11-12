import { NextResponse } from 'next/server'
import { listInquiries } from '@/lib/admin-data'

export async function GET() {
  return NextResponse.json({ inquiries: await listInquiries() })
}
