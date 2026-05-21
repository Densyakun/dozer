import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listFiles } from '../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    const files = await listFiles(projectId)
    return NextResponse.json({ files })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, path, content, type } = await req.json()
    if (!projectId || !path) {
      return NextResponse.json({ error: 'projectId and path required' }, { status: 400 })
    }

    const { writeFileContent } = await import('../../../lib/git/server')
    await writeFileContent(projectId, path.startsWith('/') ? path.slice(1) : path, content || '')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { projectId, oldPath, newPath } = await req.json()
    if (!projectId || !oldPath || !newPath) {
      return NextResponse.json({ error: 'projectId, oldPath, newPath required' }, { status: 400 })
    }

    const { promises: fs } = await import('fs')
    const path = await import('path')
    const { getRepoPath } = await import('../../../lib/git/server')

    const repoPath = getRepoPath(projectId)
    const cleanOld = oldPath.startsWith('/') ? oldPath.slice(1) : oldPath
    const cleanNew = newPath.startsWith('/') ? newPath.slice(1) : newPath

    await fs.rename(path.join(repoPath, cleanOld), path.join(repoPath, cleanNew))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    const filePath = req.nextUrl.searchParams.get('path')

    if (!projectId || !filePath) {
      return NextResponse.json({ error: 'projectId and path required' }, { status: 400 })
    }

    const { deleteFileEntry } = await import('../../../lib/git/server')
    await deleteFileEntry(projectId, filePath.startsWith('/') ? filePath.slice(1) : filePath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
