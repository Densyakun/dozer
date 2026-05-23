import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitBranches, gitCheckout, gitCreateBranch } from '../../../../lib/git/server'
import { supabase } from '../../../../lib/supabaseClient'

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    // Get workspace to check if it has a repo_url and default_branch
    let repoUrl: string | undefined
    let defaultBranch: string | undefined
    if (supabase) {
      const { data } = await supabase
        .from('workspaces')
        .select('repo_url, default_branch')
        .eq('id', workspaceId)
        .single()
      repoUrl = data?.repo_url || undefined
      defaultBranch = data?.default_branch || undefined
    }

    const { branches, current } = await gitBranches(workspaceId, repoUrl, defaultBranch)
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
