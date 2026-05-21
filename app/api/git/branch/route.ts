import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitBranches, gitCheckout, gitCreateBranch } from '../../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    const { branches, current } = await gitBranches(projectId)
    return NextResponse.json({ branches, current })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, name } = await req.json()
    if (!projectId || !name) {
      return NextResponse.json({ error: 'projectId and name required' }, { status: 400 })
    }

    await gitCreateBranch(projectId, name)
    return NextResponse.json({ ok: true, message: `Branch ${name} created` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { projectId, branch } = await req.json()
    if (!projectId || !branch) {
      return NextResponse.json({ error: 'projectId and branch required' }, { status: 400 })
    }

    await gitCheckout(projectId, branch)
    return NextResponse.json({ ok: true, message: `Switched to ${branch}` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
