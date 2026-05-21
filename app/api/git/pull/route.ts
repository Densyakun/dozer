import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitPull } from '../../../../lib/git/server'

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    await gitPull(projectId)
    return NextResponse.json({ ok: true, message: 'Pulled' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
