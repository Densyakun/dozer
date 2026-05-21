'use client'

import React, { useMemo } from 'react'
import { useFileSystemStore, type FileEntry } from '../lib/store/fileSystem'

function FileItem({ file, isSelected, onSelect }: { 
  file: FileEntry
  isSelected: boolean
  onSelect: () => void
}) {
  const fileName = file.path.split('/').pop() || file.path
  const ext = fileName.includes('.') ? fileName.split('.').pop() : ''
  
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left py-2 px-3 rounded-lg border transition-colors ${
        isSelected 
          ? 'border-blue-300 bg-blue-50 text-blue-700' 
          : 'border-transparent hover:border-gray-200 hover:bg-gray-50 active:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          ext === 'tsx' || ext === 'jsx' ? 'bg-blue-100 text-blue-700' :
          ext === 'ts' || ext === 'js' ? 'bg-yellow-100 text-yellow-700' :
          ext === 'json' ? 'bg-green-100 text-green-700' :
          'bg-gray-100 text-gray-600'
        }`}>
          {ext || 'FILE'}
        </span>
        <span className="text-sm truncate">{fileName}</span>
      </div>
      <div className="text-xs text-gray-400 mt-0.5 truncate pl-12">{file.path}</div>
    </button>
  )
}

export default function FileTree() {
  const files = useFileSystemStore(s => s.files)
  const currentFile = useFileSystemStore(s => s.currentFile)
  const setCurrentFile = useFileSystemStore(s => s.setCurrentFile)
  
  const sortedFiles = useMemo(() => {
    return Array.from(files.values()).sort((a, b) => a.path.localeCompare(b.path))
  }, [files])
  
  return (
    <div className="p-4 h-full overflow-auto bg-white">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-gray-900">ファイル</span>
        <span className="text-xs text-gray-500">{sortedFiles.length} ファイル</span>
      </div>
      {sortedFiles.length === 0 ? (
        <div className="text-sm text-gray-500 py-4">ファイルがありません</div>
      ) : (
        <ul className="text-sm space-y-1">
          {sortedFiles.map((f) => (
            <li key={f.path}>
              <FileItem
                file={f}
                isSelected={currentFile === f.path}
                onSelect={() => setCurrentFile(f.path)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}