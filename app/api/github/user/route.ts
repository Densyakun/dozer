import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('github_token')?.value
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: res.status })
    }

    const user = await res.json()
    return NextResponse.json({ user })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
