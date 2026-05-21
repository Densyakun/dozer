import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitPush } from '../../../../lib/git/server'

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    await gitPush(projectId)
    return NextResponse.json({ ok: true, message: 'Pushed' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
