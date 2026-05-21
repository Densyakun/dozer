import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { shallowClone, getRepoPath } from '../../../../lib/git/server'
import { promises as fs } from 'fs'

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, projectId } = await req.json()
    if (!repoUrl || !projectId) {
      return NextResponse.json({ error: 'repoUrl and projectId required' }, { status: 400 })
    }

    const repoPath = getRepoPath(projectId)
    const exists = await fs.stat(repoPath).then(() => true).catch(() => false)

    if (!exists) {
      await shallowClone(repoUrl, projectId)
    }

    return NextResponse.json({ ok: true, message: 'Repository cloned' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
