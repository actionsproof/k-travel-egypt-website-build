import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAdminEmail, getAllowedAdminEmails } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const currentAdminEmail = await getCurrentAdminEmail()
  if (currentAdminEmail) redirect('/admin')

  const allowedEmails = await getAllowedAdminEmails()

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f3f4f6', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 28, boxShadow: '0 12px 32px rgba(17,24,39,0.08)' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280' }}>Admin access</p>
        <h1 style={{ margin: '12px 0 10px', fontSize: 30 }}>Sign in</h1>

        {allowedEmails.length === 0 ? (
          <div style={{ background: '#fef3c7', border: '1px solid #facc15', borderRadius: 12, padding: 14, color: '#78350f' }}>
            Set <code>ADMIN_EMAIL</code> and <code>NEON_AUTH_COOKIE_SECRET</code> in your environment before using the admin panel.
          </div>
        ) : (
          <form action="/api/admin/login" method="POST" style={{ display: 'grid', gap: 16, marginTop: 20 }}>
            <label style={{ display: 'grid', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Email address</span>
              <input
                type="email"
                name="email"
                defaultValue={allowedEmails[0]}
                required
                style={{ padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 16 }}
              />
            </label>

            <button type="submit" style={{ padding: '12px 16px', border: 'none', borderRadius: 10, background: '#111827', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Continue
            </button>
          </form>
        )}

        <div style={{ marginTop: 18, fontSize: 14, color: '#4b5563' }}>
          Allowed email: <strong>{allowedEmails[0] ?? 'not configured'}</strong>
        </div>

        <div style={{ marginTop: 18 }}>
          <Link href="/" style={{ color: '#111827', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to site
          </Link>
        </div>
      </div>
    </main>
  )
}
