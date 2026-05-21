import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { gitDiff } from '../../../../lib/git/server'

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get('projectId')
    const filePath = req.nextUrl.searchParams.get('file') || undefined

    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    const diffText = await gitDiff(projectId, filePath)
    return NextResponse.json({ diff: { file: filePath || '', hunks: parseDiff(diffText) } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function parseDiff(text: string) {
  if (!text) return []
  const hunks: { oldStart: number; newStart: number; lines: { type: string; content: string }[] }[] = []
  let current: typeof hunks[0] | null = null

  for (const line of text.split('\n')) {
    const hunkMatch = line.match(/^@@ -(\d+),?\d* \+(\d+),?\d* @@/)
    if (hunkMatch) {
      if (current) hunks.push(current)
      current = { oldStart: Number(hunkMatch[1]), newStart: Number(hunkMatch[2]), lines: [] }
    } else if (current) {
      const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'remove' : 'context'
      current.lines.push({ type, content: line })
    }
  }
  if (current) hunks.push(current)
  return hunks
}
