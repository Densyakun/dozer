import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitCommit } from '../../../../lib/git/server'

export async function POST(req: NextRequest) {
  try {
    const { projectId, message } = await req.json()
    if (!projectId || !message) {
      return NextResponse.json({ error: 'projectId and message required' }, { status: 400 })
    }

    await gitCommit(projectId, message)
    return NextResponse.json({ ok: true, message: 'Committed' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
