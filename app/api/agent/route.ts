import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getOpenAIConfig } from '../../../lib/agent/config'
import { runAgent } from '../../../lib/agent/runAgent'
import type { AgentStatus } from '../../../lib/agent/types'

function agentStatus(): AgentStatus {
  const { connected, model } = getOpenAIConfig()
  if (connected) {
    return {
      ok: true,
      connected: true,
      provider: 'openai',
      model,
      status: 'ready',
    }
  }
  return {
    ok: true,
    connected: false,
    provider: 'mock',
    status: 'mock',
    hint: '.env.local に OPENAI_API_KEY を設定し、npm run dev を再起動してください。',
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) {
    return NextResponse.json({ ok: false, error: 'prompt is required' }, { status: 400 })
  }

  try {
    const result = await runAgent(prompt)
    const status = agentStatus()
    return NextResponse.json({
      ok: true,
      connected: status.connected,
      provider: status.provider,
      action: { type: 'message', text: result.message },
      message: result.message,
      actions: result.actions,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      {
        ok: false,
        connected: getOpenAIConfig().connected,
        error: message,
        action: { type: 'message', text: `エラー: ${message}` },
      },
      { status: 502 }
    )
  }
}

export async function GET() {
  return NextResponse.json(agentStatus())
}
