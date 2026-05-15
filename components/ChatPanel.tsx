'use client'

import React, { useState } from 'react'

type AgentResponse = {
  action?: { type?: string; text?: string }
  actions?: unknown[]
  ok?: boolean
}

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const [log, setLog] = useState<string[]>([])

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim()) return
    const prompt = input.trim()
    setLog((s) => [...s, `あなた: ${prompt}`])
    setInput('')
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = (await res.json()) as AgentResponse
      const text =
        data.action?.text ??
        (data.ok === false ? 'エラーが発生しました' : JSON.stringify(data))
      setLog((s) => [...s, `エージェント: ${text}`])
    } catch (err) {
      setLog((s) => [...s, `エージェント: 通信エラー (${String(err)})`])
    }
  }

  return (
    <div className="p-4 h-full flex flex-col bg-white min-h-0">
      <div className="flex-1 overflow-auto mb-2 rounded-lg bg-gray-50 p-3 border border-gray-100">
        {log.length === 0 ? (
          <div className="text-sm text-gray-500">AIチャットログがここに表示されます</div>
        ) : (
          log.map((l, i) => (
            <div key={i} className="text-sm py-1 whitespace-pre-wrap">
              {l}
            </div>
          ))
        )}
      </div>
      <form className="flex gap-2 shrink-0" onSubmit={send}>
        <input
          aria-label="メッセージ"
          className="flex-1 p-3 rounded-lg border border-gray-200 min-w-0"
          placeholder="AIに指示を入力"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-3 rounded-lg shrink-0 font-medium"
        >
          送信
        </button>
      </form>
    </div>
  )
}
