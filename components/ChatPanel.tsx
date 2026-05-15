'use client'

import React, { useCallback, useEffect, useState } from 'react'

type AgentAction = {
  type: string
  path?: string
  content?: string
  command?: string
}

type AgentStatus = {
  ok: boolean
  connected: boolean
  provider: 'openai' | 'mock'
  model?: string
  status: string
  hint?: string
}

type AgentResponse = {
  ok?: boolean
  connected?: boolean
  provider?: string
  action?: { type?: string; text?: string }
  message?: string
  actions?: AgentAction[]
  error?: string
}

async function executeActions(actions: AgentAction[]): Promise<string[]> {
  const lines: string[] = []
  for (const action of actions) {
    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    })
    const data = (await res.json()) as { ok?: boolean; message?: string; error?: string }
    if (action.type === 'writeFile' && action.path) {
      lines.push(
        data.ok
          ? `✓ writeFile ${action.path}: ${data.message ?? 'ok'}`
          : `✗ writeFile ${action.path}: ${data.error ?? 'failed'}`
      )
    } else if (action.type === 'runCommand' && action.command) {
      lines.push(
        data.ok
          ? `✓ runCommand ${action.command}: ${data.message ?? 'ok'}`
          : `✗ runCommand: ${data.error ?? 'failed'}`
      )
    }
  }
  return lines
}

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/agent')
      const data = (await res.json()) as AgentStatus
      setStatus(data)
    } catch {
      setStatus({
        ok: false,
        connected: false,
        provider: 'mock',
        status: 'error',
        hint: 'サーバに接続できません。npm run dev が起動しているか確認してください。',
      })
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || loading) return
    const prompt = input.trim()
    setLog((s) => [...s, `あなた: ${prompt}`])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = (await res.json()) as AgentResponse
      const text =
        data.message ??
        data.action?.text ??
        data.error ??
        (data.ok === false ? 'エラーが発生しました' : JSON.stringify(data))
      setLog((s) => [...s, `エージェント: ${text}`])

      if (Array.isArray(data.actions) && data.actions.length > 0) {
        const execLines = await executeActions(data.actions)
        if (execLines.length > 0) {
          setLog((s) => [...s, ...execLines.map((l) => `  ${l}`)])
        }
      }

      if (typeof data.connected === 'boolean') {
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                connected: data.connected!,
                provider: (data.provider as 'openai' | 'mock') ?? prev.provider,
              }
            : prev
        )
      }
    } catch (err) {
      setLog((s) => [...s, `エージェント: 通信エラー (${String(err)})`])
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = !status
    ? '接続確認中…'
    : status.connected
      ? `AI 接続済み (${status.model ?? 'OpenAI'})`
      : 'モックモード（API キー未設定）'

  const statusClass = !status
    ? 'bg-gray-100 text-gray-600'
    : status.connected
      ? 'bg-green-50 text-green-800 border-green-200'
      : 'bg-amber-50 text-amber-900 border-amber-200'

  return (
    <div className="p-4 h-full flex flex-col bg-white min-h-0">
      <div
        className={`mb-2 px-3 py-2 rounded-lg border text-xs shrink-0 ${statusClass}`}
        role="status"
      >
        <div className="font-medium">{statusLabel}</div>
        {status?.hint && !status.connected && (
          <div className="mt-1 opacity-90">{status.hint}</div>
        )}
      </div>

      <div className="flex-1 overflow-auto mb-2 rounded-lg bg-gray-50 p-3 border border-gray-100 min-h-0">
        {log.length === 0 ? (
          <div className="text-sm text-gray-500">
            AI に指示を送ると、ここに応答とアクション（writeFile 等）が表示されます。
          </div>
        ) : (
          log.map((l, i) => (
            <div key={i} className="text-sm py-1 whitespace-pre-wrap">
              {l}
            </div>
          ))
        )}
        {loading && <div className="text-sm text-gray-500 mt-2">考え中…</div>}
      </div>

      <form className="flex gap-2 shrink-0" onSubmit={send}>
        <input
          aria-label="メッセージ"
          className="flex-1 p-3 rounded-lg border border-gray-200 min-w-0 disabled:opacity-60"
          placeholder="AIに指示を入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-3 rounded-lg shrink-0 font-medium disabled:opacity-60"
          disabled={loading}
        >
          {loading ? '…' : '送信'}
        </button>
      </form>
    </div>
  )
}
