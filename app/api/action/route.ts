import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  // Basic executor: currently supports runCommand and writeFile actions
  if (body.type === 'writeFile') {
    // In a real system, we would persist to virtual FS / Supabase / GitHub
    return NextResponse.json({ ok: true, message: `writeFile ${body.path}` })
  }
  if (body.type === 'runCommand') {
    return NextResponse.json({ ok: true, message: `runCommand ${body.command}` })
  }
  return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 })
}
