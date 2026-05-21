import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getGitStatus } from '../../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    const status = await getGitStatus(workspaceId)
    return NextResponse.json({ status })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
