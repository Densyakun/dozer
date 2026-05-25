'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useFileSystemStore } from '../lib/store/fileSystem'
import { lazyLoadFile } from '../lib/filesystem/lazyLoader'
import { useWorkspaceStore } from '../lib/store/workspaceStore'

export default function Editor() {
  const currentFile = useFileSystemStore(s => s.currentFile)
  const fileContents = useFileSystemStore(s => s.fileContents)
  const updateFileContent = useFileSystemStore(s => s.updateFileContent)
  const saveFileContent = useFileSystemStore(s => s.saveFileContent)
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace)

  console.log('[Editor] Render - currentFile:', currentFile, 'workspaceId:', activeWorkspace?.id)

  const [localContent, setLocalContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const workspaceId = activeWorkspace?.id ?? '1'

  useEffect(() => {
    console.log('[Editor] currentFile changed:', currentFile)
    if (currentFile) {
      const cached = fileContents.get(currentFile)
      console.log('[Editor] cached content:', cached !== undefined ? 'YES' : 'NO')
      if (cached !== undefined) {
        setLocalContent(cached)
        setHasUnsavedChanges(false)
      } else {
        setLocalContent('')
        console.log('[Editor] Loading file from server:', currentFile)
        void lazyLoadFile(workspaceId, currentFile)
      }
    } else {
      setLocalContent('')
    }
    setIsEditing(false)
  }, [currentFile, fileContents, workspaceId])

  const handleSave = useCallback(async () => {
    console.log('[Editor] handleSave called:', { currentFile, hasUnsavedChanges, isSaving })
    if (!currentFile || !hasUnsavedChanges || isSaving) return
    console.log('[Editor] Starting save for:', currentFile)
    setIsSaving(true)
    const success = await saveFileContent(workspaceId, currentFile, localContent)
    setIsSaving(false)
    console.log('[Editor] Save result:', success)
    if (success) {
      setHasUnsavedChanges(false)
      updateFileContent(currentFile, localContent)
    }
  }, [currentFile, hasUnsavedChanges, isSaving, localContent, saveFileContent, workspaceId, updateFileContent])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('[Editor] handleChange called')
    const newContent = e.target.value
    console.log('[Editor] Content changed, length:', newContent.length)
    setLocalContent(newContent)
    setHasUnsavedChanges(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    void handleSave()
  }, [handleSave])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

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
          {isSaving && (
            <span className="text-xs text-gray-400">保存中...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="px-3 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            保存
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{localContent.split('\n').length} 行</span>
            <span>{(new Blob([localContent]).size / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <textarea
          value={localContent}
          onChange={handleChange}
          onFocus={() => {
            console.log('[Editor] textarea focused')
            setIsEditing(true)
          }}
          onBlur={handleBlur}
          onInput={(e) => {
            console.log('[Editor] onInput event fired')
          }}
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
