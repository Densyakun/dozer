import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type ProjectRecord = {
  id: string
  name: string
  repo_url?: string
  default_branch?: string
  description?: string
  owner_id?: string
  github_id?: string
  created_at?: string
  updated_at?: string
  is_active?: boolean
}

let projects: ProjectRecord[] = []

export async function GET() {
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const project: ProjectRecord = {
      id: String(Date.now()),
      name: body.name || 'Untitled',
      repo_url: body.repo_url || '',
      default_branch: body.default_branch || 'main',
      description: body.description || '',
      created_at: new Date().toISOString(),
      is_active: false,
    }
    projects.push(project)
    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const idx = projects.findIndex(p => p.id === body.id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (body.is_active) {
      projects.forEach(p => p.is_active = false)
    }
    projects[idx] = { ...projects[idx], ...body }
    return NextResponse.json(projects[idx])
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const idx = projects.findIndex(p => p.id === id)
  if (idx === -1) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  projects.splice(idx, 1)
  return NextResponse.json({ ok: true })
}
