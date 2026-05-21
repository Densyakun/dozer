'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export type MobileTab = 'workspaces' | 'files' | 'preview' | 'agent' | 'git'

type MobileShellProps = {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  children: React.ReactNode
}

const TABS: { id: MobileTab; label: string }[] = [
  { id: 'workspaces', label: 'ワークスペース' },
  { id: 'files', label: 'ファイル' },
  { id: 'preview', label: 'プレビュー' },
  { id: 'agent', label: 'エージェント' },
  { id: 'git', label: 'Git' },
]

export default function MobileShell({ activeTab, onTabChange, children }: MobileShellProps) {
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)

  useEffect(() => {
    setSupabaseConnected(supabase !== null)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      <nav
        className="h-14 bg-white border-t border-gray-200 flex items-stretch justify-around shrink-0 pb-[max(0px,env(safe-area-inset-bottom))]"
        aria-label="メイン"
      >
        {TABS.map((t) => {
          const selected = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                selected ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-current={selected ? 'page' : undefined}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          )
        })}
        {supabaseConnected !== null && (
          <div
            className="absolute right-2 bottom-14 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
            title={supabaseConnected ? 'Supabase: connected' : 'Supabase: not connected'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${supabaseConnected ? 'bg-green-500' : 'bg-red-400'}`}
            />
            <span className={supabaseConnected ? 'text-green-600' : 'text-red-500'}>
              DB
            </span>
          </div>
        )}
      </nav>
    </div>
  )
}
