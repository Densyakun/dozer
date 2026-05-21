import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('github_token')?.value
  const userCookie = req.cookies.get('github_user')?.value

  if (!token || !userCookie) {
    return NextResponse.json({ authenticated: false })
  }

  try {
    const user = JSON.parse(userCookie)
    return NextResponse.json({ authenticated: true, user })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
