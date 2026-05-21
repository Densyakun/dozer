'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useAgentStore } from '../lib/store/agentStore'
import { useFileSystemStore } from '../lib/store/fileSystem'
import { useProjectStore } from '../lib/store/projectStore'
import { executeAIActions, type AIFileAction } from '../features/ai/AIFileActions'

type AgentStatus = {
  ok: boolean
  connected: boolean
  provider: 'portkey' | 'mock'
  model?: string
  configId?: string
  status: string
  hint?: string
}

type AgentResponse = {
  ok?: boolean
  connected?: boolean
  provider?: string
  action?: { type?: string; text?: string }
  message?: string
  actions?: { type: string; path?: string; content?: string; command?: string }[]
  error?: string
}

export default function ChatPanel() {
  const messages = useAgentStore(s => s.messages)
  const status = useAgentStore(s => s.status)
  const isConnected = useAgentStore(s => s.isConnected)
  const model = useAgentStore(s => s.model)
  const isConfigMode = useAgentStore(s => s.isConfigMode)
  const addMessage = useAgentStore(s => s.addMessage)
  const setStatus = useAgentStore(s => s.setStatus)
  const setConnected = useAgentStore(s => s.setConnected)
  const activeProject = useProjectStore(s => s.activeProject)
  const loadTree = useFileSystemStore(s => s.loadTree)

  const [input, setInput] = React.useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const projectId = activeProject?.id ?? '1'

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/agent')
      const data = (await res.json()) as AgentStatus
      setConnected(data.connected, data.model, Boolean(data.configId))
    } catch {
      setConnected(false)
    }
  }, [setConnected])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    const prompt = input.trim()
    if (!prompt) return
    if (status === 'thinking') return

    setInput('')
    addMessage({ role: 'user', content: prompt })
    setStatus('thinking')

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
        (data.ok === false ? 'Error' : 'No response')

      addMessage({ role: 'agent', content: text, actions: data.actions })

      if (Array.isArray(data.actions) && data.actions.length > 0) {
        setStatus('executing')
        const results = await executeAIActions(data.actions as AIFileAction[], projectId)
        if (results.length > 0) {
          const summary = results.map(r => `${r.ok ? 'OK' : 'FAIL'} ${r.message}`).join('\n')
          addMessage({ role: 'system', content: summary })
        }
        void loadTree(projectId)
      }
    } catch (err) {
      addMessage({ role: 'agent', content: `Communication error: ${String(err)}` })
    } finally {
      setStatus('idle')
    }
  }

  const statusLabel = isConnected
    ? isConfigMode ? 'AI' : `AI (${model})`
    : 'Mock mode'

  const statusClass = isConnected
    ? 'bg-green-50 text-green-800 border-green-200'
    : 'bg-amber-50 text-amber-900 border-amber-200'

  return (
    <div className="p-4 h-full flex flex-col bg-white min-h-0">
      <div
        className={`mb-2 px-3 py-2 rounded-lg border text-xs shrink-0 ${statusClass}`}
        role="status"
      >
        <div className="font-medium flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-400'}`} />
          {statusLabel}
        </div>
        {status === 'thinking' && <div className="mt-1 text-gray-600">Thinking...</div>}
        {status === 'executing' && <div className="mt-1 text-gray-600">Executing actions...</div>}
      </div>

      <div className="flex-1 overflow-auto mb-2 rounded-lg bg-gray-50 p-3 border border-gray-100 min-h-0">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500">
            Send instructions to the AI.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`mb-3 ${msg.role === 'system' ? 'text-xs text-gray-500' : 'text-sm'}`}>
              <div className={`font-medium ${
                msg.role === 'user' ? 'text-blue-600' :
                msg.role === 'agent' ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {msg.role === 'user' ? 'You' : msg.role === 'agent' ? 'Agent' : 'System'}
              </div>
              <div className="mt-1 whitespace-pre-wrap">{msg.content}</div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 text-xs">
                  {msg.actions.map((a, i) => (
                    <div key={i} className="text-gray-600">
                      {a.type === 'writeFile' ? `Write ${a.path}` :
                       a.type === 'deleteFile' ? `Delete ${a.path}` :
                       a.type === 'runCommand' ? `Run ${a.command}` :
                       `${a.type}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="flex gap-2 shrink-0" onSubmit={send}>
        <input
          aria-label="Message"
          className="flex-1 p-3 rounded-lg border border-gray-200 min-w-0 disabled:opacity-60"
          placeholder="Enter instructions"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status === 'thinking'}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-3 rounded-lg shrink-0 font-medium disabled:opacity-60"
          disabled={status === 'thinking' || !input.trim()}
        >
          {status === 'thinking' ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
