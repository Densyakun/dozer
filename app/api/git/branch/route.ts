import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitBranches, gitCheckout, gitCreateBranch } from '../../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    const { branches, current } = await gitBranches(workspaceId)
    return NextResponse.json({ branches, current })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, name } = await req.json()
    if (!workspaceId || !name) {
      return NextResponse.json({ error: 'workspaceId and name required' }, { status: 400 })
    }

    await gitCreateBranch(workspaceId, name)
    return NextResponse.json({ ok: true, message: `Branch ${name} created` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { workspaceId, branch } = await req.json()
    if (!workspaceId || !branch) {
      return NextResponse.json({ error: 'workspaceId and branch required' }, { status: 400 })
    }

    await gitCheckout(workspaceId, branch)
    return NextResponse.json({ ok: true, message: `Switched to ${branch}` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
