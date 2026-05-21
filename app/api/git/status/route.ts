import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getGitStatus } from '../../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    const status = await getGitStatus(projectId)
    return NextResponse.json({ status })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
