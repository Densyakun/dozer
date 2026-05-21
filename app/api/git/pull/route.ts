import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitPull } from '../../../../lib/git/server'

export async function POST(req: NextRequest) {
  try {
    const { workspaceId } = await req.json()
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    await gitPull(workspaceId)
    return NextResponse.json({ ok: true, message: 'Pulled' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
