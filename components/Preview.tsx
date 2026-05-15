'use client'
import React, { useState } from 'react'

export default function Preview() {
  const [mode] = useState<'light' | 'heavy'>('light')

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="p-2 flex items-center justify-between border-b border-gray-200 bg-white shrink-0">
        <div className="text-sm font-medium">プレビュー ({mode})</div>
        <div className="text-xs text-gray-500">軽量: tsx-safe-eval / 重量: WebContainer</div>
      </div>
      <div className="flex-1 min-h-0 bg-white m-2 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <iframe
          title="preview"
          className="w-full h-full min-h-[12rem] border-0"
          srcDoc='<!doctype html><html><body><div id="root">軽量プレビュー（iframe）</div></body></html>'
        />
      </div>
    </div>
  )
}
