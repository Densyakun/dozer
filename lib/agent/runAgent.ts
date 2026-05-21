import { getPortKeyConfig } from './config'
import { AGENT_SYSTEM_PROMPT } from './systemPrompt'
import type { AgentAction, AgentResult } from './types'

function parseAgentJson(raw: string): AgentResult {
  const parsed = JSON.parse(raw) as {
    message?: string
    actions?: unknown[]
  }
  const message = typeof parsed.message === 'string' ? parsed.message : '応答を解析できませんでした。'
  const actions: AgentAction[] = []
  if (Array.isArray(parsed.actions)) {
    for (const item of parsed.actions) {
      if (!item || typeof item !== 'object') continue
      const a = item as Record<string, unknown>
      if (a.type === 'writeFile' && typeof a.path === 'string' && typeof a.content === 'string') {
        actions.push({ type: 'writeFile', path: a.path, content: a.content })
      } else if (a.type === 'runCommand' && typeof a.command === 'string') {
        actions.push({ type: 'runCommand', command: a.command })
      }
    }
  }
  return { message, actions }
}

export async function runMockAgent(prompt: string): Promise<AgentResult> {
  return {
    message: `（モックモード）「${prompt.slice(0, 120)}」を受け取りました。実際の AI を使うには .env.local に PORTKEY_API_KEY を設定してサーバを再起動してください。`,
    actions: [
      {
        type: 'writeFile',
        path: '/src/App.tsx',
        content: `export default function App() {\n  return <div>Mock: ${prompt.slice(0, 40).replace(/`/g, '')}</div>\n}\n`,
      },
    ],
  }
}

export async function runPortKeyAgent(prompt: string): Promise<AgentResult> {
  const { apiKey, model, baseUrl, configId } = getPortKeyConfig()
  if (!apiKey || !configId) {
    return runMockAgent(prompt)
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
    'x-portkey-config': configId,
  }

  const url = `${baseUrl}/chat/completions`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: AGENT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(
      `PortKey API error ${res.status}: ${errText.slice(0, 300) || res.statusText}`
    )
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('PortKey returned an empty response')
  }

  return parseAgentJson(content)
}

export async function runAgent(prompt: string): Promise<AgentResult> {
  const { connected } = getPortKeyConfig()
  if (!connected) {
    return runMockAgent(prompt)
  }
  return runPortKeyAgent(prompt)
}
