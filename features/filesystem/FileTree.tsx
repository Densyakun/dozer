'use client'

import React, { useCallback, useState } from 'react'
import { useFileSystemStore } from '../../lib/store/fileSystem'
import { useWorkspaceStore } from '../../lib/store/workspaceStore'
import { lazyLoadFile } from '../../lib/filesystem/lazyLoader'
import type { FileTreeNode } from '../../types'

function TreeNode({
  node,
  level,
  workspaceId,
  onSelect,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
  currentFile,
}: {
  node: FileTreeNode
  level: number
  workspaceId: string
  onSelect: (path: string) => void
  onRename: (path: string) => void
  onDelete: (path: string) => void
  onCreateFile: (parentPath: string) => void
  onCreateFolder: (parentPath: string) => void
  currentFile: string | null
}) {
  const [expanded, setExpanded] = useState(node.expanded ?? false)

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev)
  }, [])

  const ext = node.type === 'file' ? (node.name.includes('.') ? node.name.split('.').pop() : '') : ''

  const extColor =
    ext === 'tsx' || ext === 'jsx' ? 'text-blue-600' :
    ext === 'ts' || ext === 'js' ? 'text-yellow-600' :
    ext === 'json' ? 'text-green-600' :
    ext === 'css' ? 'text-purple-600' :
    ext === 'html' ? 'text-orange-600' :
    'text-gray-500'

  const isSelected = currentFile === node.path

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer transition-colors text-sm
          ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
        `}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => {
          if (node.type === 'directory') {
            toggleExpand()
          } else {
            onSelect(node.path)
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault()
        }}
      >
        <span className="shrink-0 w-4 text-center text-xs text-gray-400">
          {node.type === 'directory' ? (expanded ? '▼' : '▶') : ''}
        </span>
        <span className={`shrink-0 text-xs font-bold ${extColor}`}>
          {node.type === 'directory' ? '📁' : `☰`}
        </span>
        <span className="truncate flex-1">{node.name}</span>
        {node.type === 'file' && (
          <span className="text-[10px] text-gray-400 uppercase">{ext}</span>
        )}
      </div>
      {node.type === 'directory' && expanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              workspaceId={workspaceId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              currentFile={currentFile}
            />
          ))}
          <div
            className="flex gap-1 py-1 px-2 text-xs text-gray-400 cursor-pointer hover:text-gray-600"
            style={{ paddingLeft: `${24 + (level + 1) * 16}px` }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCreateFile(node.path) }}
              className="hover:text-blue-600"
            >
              + ファイル
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCreateFolder(node.path) }}
              className="hover:text-blue-600"
            >
              + フォルダ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FileTree() {
  const tree = useFileSystemStore(s => s.tree)
  const currentFile = useFileSystemStore(s => s.currentFile)
  const openFile = useFileSystemStore(s => s.openFile)
  const setCurrentFile = useFileSystemStore(s => s.setCurrentFile)
  const createFile = useFileSystemStore(s => s.createFile)
  const createFolder = useFileSystemStore(s => s.createFolder)
  const renameFile = useFileSystemStore(s => s.renameFile)
  const deleteEntity = useFileSystemStore(s => s.deleteEntity)
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace)

  const [contextMenu, setContextMenu] = useState<{ path: string; x: number; y: number } | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [creatingFile, setCreatingFile] = useState<string | null>(null)
  const [creatingFolder, setCreatingFolder] = useState<string | null>(null)
  const [createValue, setCreateValue] = useState('')

  const workspaceId = activeWorkspace?.id ?? '1'

  const handleSelect = useCallback(async (path: string) => {
    openFile(path)
    setCurrentFile(path)
    await lazyLoadFile(workspaceId, path)
  }, [openFile, setCurrentFile, workspaceId])

  const handleRename = useCallback((path: string) => {
    setRenaming(path)
    setRenameValue(path.split('/').pop() || '')
    setContextMenu(null)
  }, [])

  const submitRename = useCallback(async () => {
    if (renaming && renameValue) {
      const parts = renaming.split('/')
      parts[parts.length - 1] = renameValue
      const newPath = parts.join('/')
      await renameFile(workspaceId, renaming, newPath)
    }
    setRenaming(null)
  }, [renaming, renameValue, renameFile, workspaceId])

  const handleDelete = useCallback(async (path: string) => {
    if (confirm(`Delete "${path}"?`)) {
      await deleteEntity(workspaceId, path)
    }
    setContextMenu(null)
  }, [deleteEntity, workspaceId])

  const handleCreateFile = useCallback((parentPath: string) => {
    setCreatingFile(parentPath)
    setCreateValue('')
  }, [])

  const handleCreateFolder = useCallback((parentPath: string) => {
    setCreatingFolder(parentPath)
    setCreateValue('')
  }, [])

  const submitCreate = useCallback(async () => {
    if (creatingFile && createValue) {
      const path = creatingFile === '/' ? `/${createValue}` : `${creatingFile}/${createValue}`
      await createFile(workspaceId, path)
    } else if (creatingFolder && createValue) {
      const path = creatingFolder === '/' ? `/${createValue}` : `${creatingFolder}/${createValue}`
      await createFolder(workspaceId, path)
    }
    setCreatingFile(null)
    setCreatingFolder(null)
    setCreateValue('')
  }, [creatingFile, creatingFolder, createValue, createFile, createFolder, workspaceId])

  return (
    <div className="p-3 h-full overflow-auto bg-white">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-sm">ファイル</span>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => handleCreateFile('/')}
            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-500"
          >
            + ファイル
          </button>
          <button
            type="button"
            onClick={() => handleCreateFolder('/')}
            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-500"
          >
            + フォルダ
          </button>
        </div>
      </div>

      {/* Creating file at root */}
      {creatingFile && (
        <div className="mb-2" style={{ paddingLeft: '12px' }}>
          {creatingFile !== '/' && (
            <span className="text-xs text-gray-400">{creatingFile}/</span>
          )}
          <input
            autoFocus
            className="w-full p-1 text-sm border rounded mt-1"
            placeholder="filename.tsx"
            value={createValue}
            onChange={e => setCreateValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') void submitCreate()
              if (e.key === 'Escape') { setCreatingFile(null); setCreatingFolder(null) }
            }}
            onBlur={() => { setTimeout(() => { setCreatingFile(null); setCreatingFolder(null) }, 200) }}
          />
        </div>
      )}

      {tree.length === 0 ? (
        <div className="text-sm text-gray-400 py-4 text-center">
          ファイルがありません
        </div>
      ) : (
        tree.map(node => (
          <TreeNode
            key={node.path}
            node={node}
            level={0}
            workspaceId={workspaceId}
            onSelect={handleSelect}
            onRename={handleRename}
            onDelete={handleDelete}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            currentFile={currentFile}
          />
        ))
      )}
    </div>
  )
}
