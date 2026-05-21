'use client'

import React, { useState } from 'react'
import MobileShell, { type MobileTab } from './components/MobileShell'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../components/FileTree'
import Preview from '../components/Preview'
import Editor from '../components/Editor'

type EditorTab = 'edit' | 'preview'

export default function Page() {
  const [tab, setTab] = useState<MobileTab>('preview')
  const [editorTab, setEditorTab] = useState<EditorTab>('preview')

  return (
    <MobileShell activeTab={tab} onTabChange={setTab}>
      {/* モバイル: 単一ペイン + 下部ナビ */}
      <div className="h-full md:hidden min-h-0">
        {tab === 'files' && <FileTree />}
        {tab === 'preview' && (
          <div className="h-full flex flex-col">
            <div className="flex border-b border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setEditorTab('edit')}
                className={`flex-1 py-2 text-sm font-medium ${editorTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('preview')}
                className={`flex-1 py-2 text-sm font-medium ${editorTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                プレビュー
              </button>
            </div>
            {editorTab === 'edit' ? <Editor /> : <Preview />}
          </div>
        )}
        {tab === 'agent' && <ChatPanel />}
      </div>
      {/* タブレット以上: ファイル + エディタ/プレビュー、チャットは下 */}
      <div className="hidden md:flex h-full min-h-0 flex-col">
        <div className="flex-1 flex flex-row overflow-hidden min-h-0">
          <div className="w-72 shrink-0 border-r border-gray-200 bg-white overflow-hidden min-h-0">
            <FileTree />
          </div>
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <div className="flex border-b border-gray-200 shrink-0">
              <button
                type="button"
                onClick={() => setEditorTab('edit')}
                className={`px-4 py-2 text-sm font-medium ${editorTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('preview')}
                className={`px-4 py-2 text-sm font-medium ${editorTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                プレビュー
              </button>
            </div>
            <div className="flex-1 min-h-0 bg-gray-50">
              {editorTab === 'edit' ? <Editor /> : <Preview />}
            </div>
          </div>
        </div>
        <div className="h-72 shrink-0 border-t border-gray-200 bg-white min-h-0">
          <ChatPanel />
        </div>
      </div>
    </MobileShell>
  )
}