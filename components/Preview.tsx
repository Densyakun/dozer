'use client'
import React, { useState } from 'react'

export default function Preview() {
  const [mode] = useState<'light' | 'heavy'>('light')

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 flex items-center justify-between border-b">
        <div className="text-sm font-medium">プレビュー ({mode})</div>
        <div className="text-xs text-gray-500">軽量: tsx-safe-eval / 重量: WebContainer</div>
      </div>
      <div className="flex-1 bg-white m-2 rounded shadow-sm overflow-auto">
        <iframe title="preview" className="w-full h-full" srcDoc={`<!doctype html><html><body><div id="root">軽量プレビュー</div></body></html>`} />
      </div>
    </div>
  )
}
