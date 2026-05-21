import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type WorkspaceRecord = {
  id: string
  project_id: string
  name: string
  opened_files: string[]
  active_tab?: string
  editor_state?: Record<string, unknown>
  preview_state?: Record<string, unknown>
  created_at?: string
  last_opened_at?: string
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
    const existing = workspaces.find(w => w.project_id === body.project_id)
    if (existing) {
      existing.last_opened_at = new Date().toISOString()
      return NextResponse.json(existing)
    }

    const workspace: WorkspaceRecord = {
      id: String(Date.now()),
      project_id: body.project_id,
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
    Object.assign(ws, body)
    return NextResponse.json(ws)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
