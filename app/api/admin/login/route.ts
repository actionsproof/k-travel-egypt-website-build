import { NextResponse } from 'next/server'
import { isAllowedAdminEmail, setAdminSession, verifyAdminPassword } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let email = ''
  let password = ''

  try {
    const formData = await request.formData()
    email = String(formData.get('email') ?? '').trim()
    password = String(formData.get('password') ?? '')
  } catch {
    try {
      const json = (await request.json()) as { email?: string; password?: string }
      email = String(json.email ?? '').trim()
      password = String(json.password ?? '')
    } catch {
      return NextResponse.json({ error: 'Invalid login payload.' }, { status: 400 })
    }
  }

  if (!email || !(await isAllowedAdminEmail(email)) || !verifyAdminPassword(password)) {
    return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 403 })
  }

  await setAdminSession(email)
  return NextResponse.redirect(new URL('/admin', request.url))
}
