import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { shallowClone } from '../../../../lib/git/server'

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, workspaceId } = await req.json()
    if (!repoUrl || !workspaceId) {
      return NextResponse.json({ error: 'repoUrl and workspaceId required' }, { status: 400 })
    }

    await shallowClone(repoUrl, workspaceId)
    return NextResponse.json({ ok: true, message: 'Repository cloned' })
  } catch (err) {
    console.error('Git clone error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
