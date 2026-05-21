import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { shallowClone, getRepoPath } from '../../../../lib/git/server'
import { promises as fs } from 'fs'

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, workspaceId } = await req.json()
    if (!repoUrl || !workspaceId) {
      return NextResponse.json({ error: 'repoUrl and workspaceId required' }, { status: 400 })
    }

    const repoPath = getRepoPath(workspaceId)
    const exists = await fs.stat(repoPath).then(() => true).catch(() => false)

    if (!exists) {
      await shallowClone(repoUrl, workspaceId)
    }

    return NextResponse.json({ ok: true, message: 'Repository cloned' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
