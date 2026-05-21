import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { executeAction, type Action } from '../../../agent/actionExecutor'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = body as Action
    
    if (!action.type) {
      return NextResponse.json(
        { ok: false, error: 'action.type is required' },
        { status: 400 }
      )
    }
    
    if (action.type === 'writeFile') {
      if (!action.path) {
        return NextResponse.json(
          { ok: false, error: 'action.path is required for writeFile' },
          { status: 400 }
        )
      }
      if (typeof action.content !== 'string') {
        return NextResponse.json(
          { ok: false, error: 'action.content is required for writeFile' },
          { status: 400 }
        )
      }
    }
    
    const result = await executeAction(action)
    
    return NextResponse.json({
      ok: result.ok,
      message: result.message,
      applied: result.applied ?? false,
      error: result.error,
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('Action API error:', error)
    return NextResponse.json(
      { ok: false, error },
      { status: 500 }
    )
  }
}