'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SupabaseWarning() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setConnected(supabase !== null)
  }, [])

  if (connected === null || connected || dismissed) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-amber-500 font-bold">⚠</span>
        <span>Supabase に接続されていません。プロジェクトのファイルはサーバー再起動後に保持されません。</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-amber-600 hover:text-amber-800 shrink-0 ml-2"
        aria-label="閉じる"
      >
        ✕
      </button>
    </div>
  )
}
