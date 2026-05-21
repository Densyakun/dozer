'use client'

import React from 'react'
import type { GitDiff } from '../../types'

export default function DiffViewer({ diff, fileName }: { diff: GitDiff; fileName?: string }) {
  if (!diff || !diff.hunks || diff.hunks.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400 text-center">
        差分がありません
      </div>
    )
  }

  return (
    <div className="text-xs font-mono">
      {fileName && (
        <div className="px-3 py-1.5 bg-gray-100 text-gray-700 font-medium text-xs border-b">
          {fileName}
        </div>
      )}
      {diff.hunks.map((hunk, i) => (
        <div key={i}>
          <div className="px-3 py-1 bg-gray-50 text-gray-500 border-b text-[10px]">
            @@ -{hunk.oldStart} +{hunk.newStart} @@
          </div>
          {hunk.lines.map((line, j) => (
            <div
              key={j}
              className={`px-3 py-0.5 leading-5 ${
                line.type === 'add' ? 'bg-green-50 text-green-800' :
                line.type === 'remove' ? 'bg-red-50 text-red-800' :
                'text-gray-600'
              }`}
            >
              <span className="inline-block w-4 shrink-0 select-none text-gray-400">
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              {line.content}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
