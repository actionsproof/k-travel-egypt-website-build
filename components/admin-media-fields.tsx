'use client'

import { upload } from '@vercel/blob/client'
import { useState, type ChangeEvent } from 'react'
import { MEDIA_CONTENT_TYPES, MEDIA_UPLOAD_LIMITS } from '@/lib/media-upload'

type MediaKind = 'image' | 'video'

const formatSize = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`

export function AdminMediaFields() {
  const [coverUrl, setCoverUrl] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>, kind: MediaKind, isCover = false) {
    const input = event.currentTarget
    const files = Array.from(input.files ?? [])
    if (!files.length) return

    const allowedTypes = MEDIA_CONTENT_TYPES[kind] as readonly string[]
    const maxBytes = kind === 'image' ? MEDIA_UPLOAD_LIMITS.imageBytes : MEDIA_UPLOAD_LIMITS.videoBytes
    const invalidFile = files.find((file) => !allowedTypes.includes(file.type) || file.size > maxBytes)
    if (invalidFile) {
      setStatus(`${invalidFile.name}: choose a supported ${kind} file up to ${formatSize(maxBytes)}.`)
      input.value = ''
      return
    }

    setUploading(true)
    setStatus(`Uploading ${files.length} ${kind}${files.length === 1 ? '' : 's'}…`)
    const submitButtons = Array.from(input.closest('form')?.querySelectorAll<HTMLButtonElement>('button[type="submit"]') ?? [])
    submitButtons.forEach((button) => { button.disabled = true })

    try {
      const urls: string[] = []
      for (const file of files) {
        const safeName = file.name.replace(/[^\w.-]+/g, '-')
        const blob = await upload(`travel/${kind}/${crypto.randomUUID()}-${safeName}`, file, {
          access: 'public',
          handleUploadUrl: '/api/admin/media',
          clientPayload: kind,
        })
        urls.push(blob.url)
      }

      if (isCover) setCoverUrl(urls[0])
      else if (kind === 'image') setImages((current) => [...current, ...urls])
      else setVideos((current) => [...current, ...urls])
      setStatus(`Uploaded ${urls.length} ${kind}${urls.length === 1 ? '' : 's'}.`)
    } catch (error) {
      console.error('[admin-media] Upload failed:', error)
      setStatus(error instanceof Error ? `Upload failed: ${error.message}` : 'Upload failed. Please try again.')
    } finally {
      input.value = ''
      setUploading(false)
      submitButtons.forEach((button) => { button.disabled = false })
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <label style={{ display: 'grid', gap: 6, color: '#374151', fontSize: 13, fontWeight: 600 }}>
        Upload cover image (max {formatSize(MEDIA_UPLOAD_LIMITS.imageBytes)})
        <input type="file" accept={MEDIA_CONTENT_TYPES.image.join(',')} disabled={uploading} onChange={(event) => void uploadFiles(event, 'image', true)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }} />
      </label>
      {coverUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
          <span>New cover uploaded.</span>
          <button type="button" onClick={() => setCoverUrl('')} style={{ border: 0, background: 'transparent', color: '#b91c1c', cursor: 'pointer' }}>Remove</button>
        </div>
      )}
      <input type="hidden" name="coverImage" value={coverUrl} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6, color: '#374151', fontSize: 13, fontWeight: 600 }}>
          Upload gallery images (max {formatSize(MEDIA_UPLOAD_LIMITS.imageBytes)} each)
          <input type="file" accept={MEDIA_CONTENT_TYPES.image.join(',')} multiple disabled={uploading} onChange={(event) => void uploadFiles(event, 'image')} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }} />
        </label>
        <label style={{ display: 'grid', gap: 6, color: '#374151', fontSize: 13, fontWeight: 600 }}>
          Upload videos (max {formatSize(MEDIA_UPLOAD_LIMITS.videoBytes)} each)
          <input type="file" accept={MEDIA_CONTENT_TYPES.video.join(',')} multiple disabled={uploading} onChange={(event) => void uploadFiles(event, 'video')} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff' }} />
        </label>
      </div>

      {images.map((url) => (
        <input key={url} type="hidden" name="uploadedImages" value={url} />
      ))}
      {videos.map((url) => (
        <input key={url} type="hidden" name="uploadedVideos" value={url} />
      ))}

      {(images.length > 0 || videos.length > 0) && (
        <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
          {images.map((url) => (
            <div key={url} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Image uploaded</span>
              <button type="button" onClick={() => setImages((current) => current.filter((entry) => entry !== url))} style={{ border: 0, background: 'transparent', color: '#b91c1c', cursor: 'pointer' }}>Remove</button>
            </div>
          ))}
          {videos.map((url) => (
            <div key={url} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Video uploaded</span>
              <button type="button" onClick={() => setVideos((current) => current.filter((entry) => entry !== url))} style={{ border: 0, background: 'transparent', color: '#b91c1c', cursor: 'pointer' }}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <p role="status" aria-live="polite" style={{ minHeight: 18, margin: 0, color: uploading ? '#1d4ed8' : '#4b5563', fontSize: 13 }}>
        {status}
      </p>
    </div>
  )
}
