'use client'

import { useState } from 'react'
import SupabaseStatus from './SupabaseStatus'

export default function StorageInfo() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-3 text-xs">
      <button
        type="button"
        className="flex items-center gap-2 font-medium text-gray-700 w-full"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        データ保存場所
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 text-gray-600">
          <SupabaseStatus />

          <div className="mt-1 border-t border-gray-100 pt-1" />

          <div className="flex items-start gap-2">
            <span className="text-blue-500 font-mono shrink-0">IndexedDB</span>
            <span>→ プロジェクト情報、Git キャッシュ、開いているファイル、ワークスペース状態</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-green-500 font-mono shrink-0">Supabase</span>
            <span>→ ワークスペースファイルの内容、ファイルメタデータ</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-amber-500 font-mono shrink-0">メモリのみ</span>
            <span>→ エディタのカーソル位置、プレビューの状態、AI エージェントのメッセージ</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-gray-400 font-mono shrink-0">除外</span>
            <span>→ node_modules（Supabase 非保存）</span>
          </div>
        </div>
      )}
    </div>
  )
}
