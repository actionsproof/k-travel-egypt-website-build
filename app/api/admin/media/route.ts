import { NextResponse } from 'next/server'
import { saveUploadedFiles } from '@/lib/media-upload'

export async function POST(request: Request) {
  const formData = await request.formData()
  const files = formData.getAll('files')
  const urls = await saveUploadedFiles(files)

  return NextResponse.json({ urls })
}
