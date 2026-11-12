import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAllowedAdminEmails, getCurrentAdminEmail } from '@/lib/admin-auth'
import { getManagedSiteContent, getManagedTrips, listInquiries } from '@/lib/admin-data'
import { isDatabaseConfigured } from '@/lib/db'
import { AdminMediaFields } from '@/components/admin-media-fields'
import { AdminSiteContentEditor } from '@/components/admin-site-content-editor'
import { SITE_CONTENT_DEFAULTS, type SiteContentKey } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

const newTripDetails = JSON.stringify({
  dates: null,
  hotels: [],
  flights: [],
  itinerary: [],
  visa: null,
  terms: [],
  notes: [],
  includes: [],
  excludes: [],
}, null, 2)

export default async function AdminPage() {
  const adminEmail = await getCurrentAdminEmail()

  if (!adminEmail) {
    redirect('/admin/login')
  }

  const allowedEmails = await getAllowedAdminEmails()
  const [trips, inquiries, siteContentEntries] = await Promise.all([
    getManagedTrips(),
    listInquiries(),
    Promise.all((Object.entries(SITE_CONTENT_DEFAULTS) as [SiteContentKey, unknown][]).map(async ([key, fallback]) => [
      key,
      await getManagedSiteContent(key, fallback),
    ])),
  ])
  const siteContent = Object.fromEntries(siteContentEntries) as Record<SiteContentKey, unknown>

  return (
    <main style={{ maxWidth: 1400, margin: '48px auto', padding: '0 20px 80px', fontFamily: 'sans-serif', color: '#111827' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#4b5563', fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin</p>
          <h1 style={{ margin: '8px 0 0', fontSize: 36 }}>K Egypt Travel dashboard</h1>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" style={{ padding: '12px 18px', borderRadius: 12, border: '1px solid #d1d5db', background: '#111827', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
            Log out
          </button>
        </form>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 36 }}>
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22 }}>
          <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>Signed in</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{adminEmail}</div>
        </div>
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22 }}>
          <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>Database</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{isDatabaseConfigured ? 'Configured' : 'Fallback mode'}</div>
        </div>
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22 }}>
          <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>Trips</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{trips.length}</div>
        </div>
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22 }}>
          <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>Inquiries</div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{inquiries.length}</div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 18, marginBottom: 28 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>Create trip</h2>
            <Link href="/trips" style={{ color: '#111827', textDecoration: 'none', fontWeight: 700 }}>Open site</Link>
          </div>

          <form action="/api/admin/trips" method="POST" encType="multipart/form-data" style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <input name="slug" placeholder="slug" defaultValue="new-trip" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              <select name="category" defaultValue="international" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }}>
                <option value="umrah">Umrah</option>
                <option value="honeymoon">Honeymoon</option>
                <option value="international">International</option>
                <option value="domestic">Domestic</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <input name="titleEn" placeholder="Title EN" defaultValue="New travel package" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              <input name="titleAr" placeholder="العنوان بالعربي" defaultValue="عرض سفر جديد" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <input name="destinationEn" placeholder="Destination EN" defaultValue="Cairo" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              <input name="destinationAr" placeholder="الوجهة بالعربي" defaultValue="القاهرة" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <input name="durationEn" placeholder="Duration EN" defaultValue="5 days · 4 nights" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              <input name="durationAr" placeholder="المدة بالعربي" defaultValue="٥ أيام · ٤ ليالي" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
              <input name="tagEn" placeholder="Tag EN" defaultValue="Featured" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              <input name="tagAr" placeholder="التاج بالعربي" defaultValue="مميز" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
            </div>

            <input name="image" placeholder="Cover image URL" defaultValue="https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=85" style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
            <AdminMediaFields />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <textarea name="galleryImages" placeholder="Image URLs (one per line or comma separated)" rows={3} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              <textarea name="galleryVideos" placeholder="Video URLs (one per line or comma separated)" rows={3} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <textarea name="summaryEn" placeholder="Summary EN" rows={3} defaultValue="Enjoy a curated trip with flexible dates and local support from our team." style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
              <textarea name="summaryAr" placeholder="ملخص بالعربي" rows={3} defaultValue="استمتع برحلة منظمة مع تواريخ مرنة ودعم محلي من فريقنا." style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db' }} />
            </div>

            <label style={{ display: 'grid', gap: 6, color: '#374151', fontSize: 13, fontWeight: 600 }}>
              Full trip details (JSON): dates, hotels, flights, itinerary, visa, terms, notes, includes and excludes
              <textarea name="tripDetailsJson" rows={16} defaultValue={newTripDetails} spellCheck={false} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 13, direction: 'ltr', textAlign: 'left' }} />
            </label>

            <button type="submit" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', fontWeight: 700, cursor: 'pointer' }}>
              Save trip
            </button>
          </form>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 22 }}>Current trips</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {trips.map((trip) => (
              <div key={trip.slug} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{trip.title.en}</div>
                    <div style={{ color: '#6b7280', fontSize: 14 }}>{trip.slug} · {trip.category}</div>
                  </div>
                  <div style={{ color: '#374151', fontSize: 14 }}>{trip.duration.en}</div>
                </div>

                <form action={`/api/admin/trips/${trip.slug}`} method="POST" encType="multipart/form-data" style={{ display: 'grid', gap: 8 }}>
                  <input type="hidden" name="_method" value="PUT" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input name="titleEn" defaultValue={trip.title.en} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                    <input name="titleAr" defaultValue={trip.title.ar} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input name="destinationEn" defaultValue={trip.destination.en} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                    <input name="destinationAr" defaultValue={trip.destination.ar} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input name="durationEn" defaultValue={trip.duration.en} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                    <input name="durationAr" defaultValue={trip.duration.ar} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                  </div>
                  <select name="category" defaultValue={trip.category} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
                    <option value="umrah">Umrah</option>
                    <option value="honeymoon">Honeymoon</option>
                    <option value="international">International</option>
                    <option value="domestic">Domestic</option>
                  </select>
                  <input name="slug" defaultValue={trip.slug} readOnly aria-label="Trip slug (cannot be changed after creation)" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb' }} />
                  <input name="image" defaultValue={trip.image} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                  <AdminMediaFields />
                  <label style={{ display: 'grid', gap: 6, color: '#374151', fontSize: 13, fontWeight: 600 }}>
                    Full trip details (JSON)
                    <textarea
                      name="tripDetailsJson"
                      rows={14}
                      spellCheck={false}
                      defaultValue={JSON.stringify({
                        dates: trip.dates ?? null,
                        hotels: trip.hotels,
                        flights: trip.flights ?? [],
                        itinerary: trip.itinerary ?? [],
                        visa: trip.visa ?? null,
                        terms: trip.terms ?? [],
                        notes: trip.notes ?? [],
                        includes: trip.includes,
                        excludes: trip.excludes,
                      }, null, 2)}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 12, direction: 'ltr', textAlign: 'left' }}
                    />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <textarea name="galleryImages" placeholder="Image URLs (one per line)" defaultValue={(trip.media ?? []).filter((item) => item.type === 'image' && !item.isPrimary).map((item) => item.url).join('\n')} rows={2} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                    <textarea name="galleryVideos" placeholder="Video URLs (one per line)" defaultValue={(trip.media ?? []).filter((item) => item.type === 'video').map((item) => item.url).join('\n')} rows={2} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button type="submit" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Update</button>
                  </div>
                </form>

                <form action={`/api/admin/trips/${trip.slug}`} method="POST">
                  <input type="hidden" name="_method" value="DELETE" />
                  <button type="submit" style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Delete</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AdminSiteContentEditor initialContent={siteContent} />

      <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 22 }}>Inquiries</h2>
        {inquiries.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No inquiries yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{inquiry.name}</strong> · {inquiry.phone}
                  </div>
                  <span style={{ background: '#f3f4f6', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>{inquiry.status}</span>
                </div>
                <div style={{ color: '#4b5563', fontSize: 14 }}>
                  Trip: {inquiry.tripSlug || 'General'} · Hotel: {inquiry.hotel || 'Not specified'} · Guests: {inquiry.adults} adults / {inquiry.children} children
                </div>
                <div style={{ color: '#374151', whiteSpace: 'pre-wrap' }}>{inquiry.notes || 'No notes provided.'}</div>
                <form action={`/api/admin/inquiries/${inquiry.id}`} method="POST" style={{ display: 'flex', gap: 8 }}>
                  <select name="status" defaultValue={inquiry.status} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="closed">closed</option>
                  </select>
                  <button type="submit" style={{ background: '#111827', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Update status</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside style={{ marginTop: 26, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 22 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 22 }}>Access setup</h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {allowedEmails.map((email) => (
            <li key={email} style={{ background: '#f3f4f6', borderRadius: 12, padding: '10px 12px', fontWeight: 600 }}>{email}</li>
          ))}
        </ul>

        <div style={{ marginTop: 20, background: '#fef3c7', border: '1px solid #facc15', borderRadius: 12, padding: 14, color: '#78350f' }}>
          Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code>, and <code>NEON_AUTH_COOKIE_SECRET</code> in the deployment environment to enable admin access in production.
        </div>
      </aside>
    </main>
  )
}
