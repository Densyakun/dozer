import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getGitStatus } from '../../../../lib/git/server'
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

    const status = await getGitStatus(workspaceId, repoUrl, defaultBranch)
    return NextResponse.json({ status })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
