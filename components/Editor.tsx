'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useFileSystemStore } from '../lib/store/fileSystem'
import { lazyLoadFile } from '../lib/filesystem/lazyLoader'
import { useWorkspaceStore } from '../lib/store/workspaceStore'

export default function Editor() {
  const currentFile = useFileSystemStore(s => s.currentFile)
  const fileContents = useFileSystemStore(s => s.fileContents)
  const updateFileContent = useFileSystemStore(s => s.updateFileContent)
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace)

  const [localContent, setLocalContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const workspaceId = activeWorkspace?.id ?? '1'

  useEffect(() => {
    if (currentFile) {
      const cached = fileContents.get(currentFile)
      if (cached !== undefined) {
        setLocalContent(cached)
        setHasUnsavedChanges(false)
      } else {
        setLocalContent('')
        void lazyLoadFile(workspaceId, currentFile)
      }
    } else {
      setLocalContent('')
    }
    setIsEditing(false)
  }, [currentFile, fileContents, workspaceId])

  useEffect(() => {
    if (currentFile) {
      const cached = fileContents.get(currentFile)
      if (cached !== undefined && cached !== localContent && !isEditing) {
        setLocalContent(cached)
        setHasUnsavedChanges(false)
      }
    }
  }, [fileContents, currentFile, isEditing, localContent])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setLocalContent(newContent)
    setHasUnsavedChanges(true)
    if (currentFile) {
      updateFileContent(currentFile, newContent)
    }
  }, [currentFile, updateFileContent])

  const fileName = currentFile?.split('/').pop() ?? ''

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">ファイルを選択してください</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-2 flex items-center justify-between border-b border-gray-200 shrink-0 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{fileName}</span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="未保存" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{localContent.split('\n').length} 行</span>
          <span>{(new Blob([localContent]).size / 1024).toFixed(1)} KB</span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <textarea
          value={localContent}
          onChange={handleChange}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          className={`w-full h-full p-4 font-mono text-sm resize-none border-0 focus:ring-0 focus:outline-none ${
            isEditing ? 'bg-white' : 'bg-gray-50'
          }`}
          placeholder="ファイルを選択してください..."
          spellCheck={false}
        />
      </div>
    </div>
  )
}
