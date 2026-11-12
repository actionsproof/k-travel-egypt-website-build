import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export type MediaKind = 'image' | 'video'

export function toText(value: FormDataEntryValue | null | undefined, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback
}

export function parseTextMediaUrls(raw: string, mediaKind: MediaKind): string[] {
  if (!raw) return []

  return raw
    .split(/[\r\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((url) => url.replace(/\s+/g, ''))
    .filter((url) => /^(https?:\/\/|\/)/i.test(url))
    .filter((value, index, list) => list.indexOf(value) === index)
}

export async function saveUploadedFiles(entries: FormDataEntryValue[] | File[] | null | undefined, mediaKind?: MediaKind): Promise<string[]> {
  const files = (entries ?? []).filter((entry): entry is File => entry instanceof File && entry.size > 0)
  if (!files.length) return []

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(uploadDir, { recursive: true })

  const urls: string[] = []

  for (const file of files) {
    const resolvedKind = mediaKind ?? (file.type?.startsWith('video/') ? 'video' : 'image')
    const extension = path.extname(file.name) || (resolvedKind === 'video' ? '.mp4' : '.jpg')
    const fileName = `${Date.now()}-${randomUUID()}${extension}`
    const filePath = path.join(uploadDir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())

    await fs.writeFile(filePath, buffer)
    urls.push(`/uploads/${fileName}`)
  }

  return urls
}
