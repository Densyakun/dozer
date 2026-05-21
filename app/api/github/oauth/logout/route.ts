import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('github_token', '', { maxAge: 0, path: '/' })
  response.cookies.set('github_user', '', { maxAge: 0, path: '/' })
  return response
}
