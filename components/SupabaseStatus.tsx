'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SupabaseStatus() {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    setConnected(supabase !== null)
  }, [])

  if (connected === null) return null

  return (
    <div className={`flex items-center gap-1.5 text-xs ${connected ? 'text-green-600' : 'text-red-500'}`}>
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
      <span>Supabase: {connected ? '接続済み' : '未接続'}</span>
      {!connected && (
        <span className="text-gray-400 text-[10px]">（.env.local に設定が必要です）</span>
      )}
    </div>
  )
}
