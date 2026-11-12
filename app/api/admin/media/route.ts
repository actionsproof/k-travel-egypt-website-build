import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { getCurrentAdminEmail } from '@/lib/admin-auth'
import { MEDIA_CONTENT_TYPES, MEDIA_UPLOAD_LIMITS } from '@/lib/media-upload'

export const runtime = 'nodejs'

class UnauthorizedUploadError extends Error {}

export async function POST(request: Request) {
  let body: HandleUploadBody
  try {
    body = await request.json() as HandleUploadBody
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 })
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await getCurrentAdminEmail())) throw new UnauthorizedUploadError()

        const kind = clientPayload === 'image' || clientPayload === 'video' ? clientPayload : null
        if (!kind || !pathname.startsWith(`travel/${kind}/`)) {
          throw new Error('Unsupported media upload.')
        }

        return {
          allowedContentTypes: [...MEDIA_CONTENT_TYPES[kind]],
          maximumSizeInBytes: kind === 'image' ? MEDIA_UPLOAD_LIMITS.imageBytes : MEDIA_UPLOAD_LIMITS.videoBytes,
          addRandomSuffix: true,
        }
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof UnauthorizedUploadError) {
      return NextResponse.json({ error: 'You must be signed in as an admin.' }, { status: 401 })
    }

    console.error('[admin-media] Blob upload token request failed:', error)
    return NextResponse.json({ error: 'Could not authorize the media upload.' }, { status: 500 })
  }
}
