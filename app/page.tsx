'use client'

import React, { useState } from 'react'
import MobileShell, { type MobileTab } from './components/MobileShell'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../components/FileTree'
import Preview from '../components/Preview'

export default function Page() {
  const [tab, setTab] = useState<MobileTab>('preview')

  return (
    <MobileShell activeTab={tab} onTabChange={setTab}>
      {/* モバイル: 単一ペイン + 下部ナビ */}
      <div className="h-full md:hidden min-h-0">
        {tab === 'files' && <FileTree />}
        {tab === 'preview' && <Preview />}
        {tab === 'agent' && <ChatPanel />}
      </div>
      {/* タブレット以上: ファイル + プレビュー、チャットは下 */}
      <div className="hidden md:flex h-full min-h-0 flex-col">
        <div className="flex-1 flex flex-row overflow-hidden min-h-0">
          <div className="w-72 shrink-0 border-r border-gray-200 bg-white overflow-hidden min-h-0">
            <FileTree />
          </div>
          <div className="flex-1 min-w-0 min-h-0 bg-gray-50">
            <Preview />
          </div>
        </div>
        <div className="h-72 shrink-0 border-t border-gray-200 bg-white min-h-0">
          <ChatPanel />
        </div>
      </div>
    </MobileShell>
  )
}
