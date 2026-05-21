import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { readFileContent } from '../../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    const filePath = req.nextUrl.searchParams.get('path')

    if (!projectId || !filePath) {
      return NextResponse.json({ error: 'projectId and path required' }, { status: 400 })
    }

    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    const content = await readFileContent(projectId, cleanPath)
    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
