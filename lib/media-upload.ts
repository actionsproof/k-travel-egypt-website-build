export const MEDIA_UPLOAD_LIMITS = {
  imageBytes: 25 * 1024 * 1024,
  videoBytes: 250 * 1024 * 1024,
} as const

export const MEDIA_CONTENT_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
} as const

export function parseTextMediaUrls(raw: string): string[] {
  if (!raw) return []

  return raw
    .split(/[\r\n,]+/)
    .map((entry) => entry.trim())
    .filter((url) => /^https?:\/\//i.test(url) || /^\/uploads\/[a-zA-Z0-9._-]+$/.test(url))
    .filter((value, index, list) => list.indexOf(value) === index)
}

export function toText(value: FormDataEntryValue | null | undefined, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}
