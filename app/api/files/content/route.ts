import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readFileContent, writeFileContent } from '../../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId')
    const filePath = req.nextUrl.searchParams.get('path')

    if (!workspaceId || !filePath) {
      return NextResponse.json({ error: 'workspaceId and path required' }, { status: 400 })
    }

    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    const content = await readFileContent(workspaceId, cleanPath)
    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { workspaceId, path, content } = await req.json()

    if (!workspaceId || !path || content === undefined) {
      return NextResponse.json({ error: 'workspaceId, path, and content required' }, { status: 400 })
    }

    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    await writeFileContent(workspaceId, cleanPath, content)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
