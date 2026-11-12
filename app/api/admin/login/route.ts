import { NextResponse } from 'next/server'
import { isAllowedAdminEmail, setAdminSession } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let email = ''

  try {
    const formData = await request.formData()
    email = String(formData.get('email') ?? '').trim()
  } catch {
    try {
      const json = (await request.json()) as { email?: string }
      email = String(json.email ?? '').trim()
    } catch {
      return NextResponse.json({ error: 'Invalid login payload.' }, { status: 400 })
    }
  }

  if (!email || !(await isAllowedAdminEmail(email))) {
    return NextResponse.json({ error: 'This email is not allowed to access the admin area.' }, { status: 403 })
  }

  await setAdminSession(email)
  return NextResponse.redirect(new URL('/admin', request.url))
}
