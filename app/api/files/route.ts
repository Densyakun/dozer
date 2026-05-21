import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { listFiles } from '../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
    }

    const files = await listFiles(workspaceId)
    return NextResponse.json({ files })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, path, content, type } = await req.json()
    if (!workspaceId || !path) {
      return NextResponse.json({ error: 'workspaceId and path required' }, { status: 400 })
    }

    const { writeFileContent } = await import('../../../lib/git/server')
    await writeFileContent(workspaceId, path.startsWith('/') ? path.slice(1) : path, content || '')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { workspaceId, oldPath, newPath } = await req.json()
    if (!workspaceId || !oldPath || !newPath) {
      return NextResponse.json({ error: 'workspaceId, oldPath, newPath required' }, { status: 400 })
    }

    const { promises: fs } = await import('fs')
    const path = await import('path')
    const { getRepoPath } = await import('../../../lib/git/server')

    const repoPath = getRepoPath(workspaceId)
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
    const workspaceId = req.nextUrl.searchParams.get('workspaceId')
    const filePath = req.nextUrl.searchParams.get('path')

    if (!workspaceId || !filePath) {
      return NextResponse.json({ error: 'workspaceId and path required' }, { status: 400 })
    }

    const { deleteFileEntry } = await import('../../../lib/git/server')
    await deleteFileEntry(workspaceId, filePath.startsWith('/') ? filePath.slice(1) : filePath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
