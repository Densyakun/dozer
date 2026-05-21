import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type WorkspaceRecord = {
  id: string
  name: string
  repo_url?: string
  default_branch?: string
  description?: string
  owner_id?: string
  github_id?: string
  opened_files: string[]
  active_tab?: string
  editor_state?: Record<string, unknown>
  preview_state?: Record<string, unknown>
  created_at?: string
  updated_at?: string
  last_opened_at?: string
  is_active?: boolean
}

const workspaces: WorkspaceRecord[] = []

export async function GET(req: NextRequest) {
  const recent = req.nextUrl.searchParams.get('recent')
  if (recent) {
    const recentList = [...workspaces]
      .sort((a, b) => {
        const aTime = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0
        const bTime = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0
        return bTime - aTime
      })
      .slice(0, 10)
    return NextResponse.json(recentList)
  }
  return NextResponse.json(workspaces)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.name && !body.workspace_id) {
      const workspace: WorkspaceRecord = {
        id: String(Date.now()),
        name: body.name || 'Untitled',
        repo_url: body.repo_url || '',
        default_branch: body.default_branch || 'main',
        description: body.description || '',
        created_at: new Date().toISOString(),
        opened_files: [],
        is_active: false,
      }
      workspaces.push(workspace)
      return NextResponse.json(workspace, { status: 201 })
    }

    const existing = workspaces.find(w => w.id === body.workspace_id)
    if (existing) {
      existing.last_opened_at = new Date().toISOString()
      return NextResponse.json(existing)
    }

    const workspace: WorkspaceRecord = {
      id: String(Date.now()),
      name: body.name || 'workspace',
      opened_files: [],
      created_at: new Date().toISOString(),
      last_opened_at: new Date().toISOString(),
    }
    workspaces.push(workspace)
    return NextResponse.json(workspace, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const ws = workspaces.find(w => w.id === body.id)
    if (!ws) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (body.is_active) {
      workspaces.forEach(w => w.is_active = false)
    }
    Object.assign(ws, body)
    return NextResponse.json(ws)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const idx = workspaces.findIndex(w => w.id === id)
  if (idx === -1) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  workspaces.splice(idx, 1)
  return NextResponse.json({ ok: true })
}
