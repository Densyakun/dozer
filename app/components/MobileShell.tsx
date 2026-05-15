'use client'

import React from 'react'

export type MobileTab = 'files' | 'preview' | 'agent'

type MobileShellProps = {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  children: React.ReactNode
}

const TABS: { id: MobileTab; label: string }[] = [
  { id: 'files', label: 'ファイル' },
  { id: 'preview', label: 'プレビュー' },
  { id: 'agent', label: 'エージェント' },
]

export default function MobileShell({ activeTab, onTabChange, children }: MobileShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 min-h-0 overflow-hidden">{children}</main>
      <nav
        className="h-16 bg-white border-t border-gray-200 flex items-stretch justify-around shrink-0 pb-[max(0px,env(safe-area-inset-bottom))]"
        aria-label="メイン"
      >
        {TABS.map((t) => {
          const selected = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-sm font-medium transition-colors ${
                selected ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-current={selected ? 'page' : undefined}
              onClick={() => onTabChange(t.id)}
            >
              <span>{t.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
