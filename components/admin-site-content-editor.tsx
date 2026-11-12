'use client'

import { useState } from 'react'
import { SITE_CONTENT_DEFAULTS, SITE_CONTENT_LABELS, type SiteContentKey } from '@/lib/site-content'

type Content = Record<SiteContentKey, unknown>

export function AdminSiteContentEditor({ initialContent }: { initialContent: Content }) {
  const [content, setContent] = useState(initialContent)
  const [selected, setSelected] = useState<SiteContentKey>('homepageContent')
  const [draft, setDraft] = useState(JSON.stringify(initialContent.homepageContent, null, 2))
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)

  function selectSection(key: SiteContentKey) {
    setSelected(key)
    setDraft(JSON.stringify(content[key], null, 2))
    setStatus('')
  }

  async function saveContent() {
    let parsed: unknown
    try {
      parsed = JSON.parse(draft)
    } catch (error) {
      setStatus(error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON.')
      return
    }

    setSaving(true)
    setStatus('Saving…')
    try {
      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: selected, content: parsed }),
      })
      const result = await response.json() as { error?: string; content?: unknown }
      if (!response.ok) throw new Error(result.error ?? 'Could not save this section.')

      const savedContent = result.content ?? parsed
      setContent((current) => ({ ...current, [selected]: savedContent }))
      setDraft(JSON.stringify(savedContent, null, 2))
      setStatus('Saved. The related public pages now use this content.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save this section.')
    } finally {
      setSaving(false)
    }
  }

  function resetDraft() {
    const value = SITE_CONTENT_DEFAULTS[selected]
    setDraft(JSON.stringify(value, null, 2))
    setStatus('Defaults loaded into the editor. Save to publish them.')
  }

  return (
    <section style={{ marginBottom: 28, padding: 22, border: '1px solid #e5e7eb', borderRadius: 18, background: '#fff' }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Website content</h2>
      <p style={{ margin: '0 0 18px', color: '#4b5563', lineHeight: 1.6 }}>
        Edit the shared content used by the homepage and related pages. Add or remove list entries in the JSON, keep both Arabic and English text, then save to publish.
      </p>
      <label style={{ display: 'grid', gap: 7, maxWidth: 480, marginBottom: 14, fontWeight: 700 }}>
        Content section
        <select value={selected} onChange={(event) => selectSection(event.target.value as SiteContentKey)} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 9, background: '#fff' }}>
          {(Object.keys(SITE_CONTENT_DEFAULTS) as SiteContentKey[]).map((key) => <option key={key} value={key}>{SITE_CONTENT_LABELS[key]}</option>)}
        </select>
      </label>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck={false}
        aria-label={`${SITE_CONTENT_LABELS[selected]} JSON`}
        rows={18}
        style={{ display: 'block', width: '100%', padding: 14, border: '1px solid #d1d5db', borderRadius: 10, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13, lineHeight: 1.55, direction: 'ltr', textAlign: 'left' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" disabled={saving} onClick={() => void saveContent()} style={{ padding: '11px 16px', border: 0, borderRadius: 9, background: '#111827', color: '#fff', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? 'Saving…' : 'Save and publish'}
        </button>
        <button type="button" disabled={saving} onClick={resetDraft} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 9, background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
          Load defaults
        </button>
        <span role="status" aria-live="polite" style={{ color: status.startsWith('Invalid') || status.startsWith('Content shape') ? '#b91c1c' : '#4b5563', fontSize: 13 }}>{status}</span>
      </div>
      <details style={{ marginTop: 14, color: '#4b5563', fontSize: 13, lineHeight: 1.6 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Editing tips</summary>
        <p>Keep the JSON syntax valid. Localized text uses separate <code>en</code> and <code>ar</code> values. Array entries can be added, edited, reordered, or removed. Field names and value types must remain unchanged.</p>
      </details>
    </section>
  )
}
