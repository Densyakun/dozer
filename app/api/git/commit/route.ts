import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitCommit } from '../../../../lib/git/server'

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, message } = await req.json()
    if (!workspaceId || !message) {
      return NextResponse.json({ error: 'workspaceId and message required' }, { status: 400 })
    }

    await gitCommit(workspaceId, message)
    return NextResponse.json({ ok: true, message: 'Committed' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
