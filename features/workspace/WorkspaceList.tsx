'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useWorkspaceStore } from '../../lib/store/workspaceStore'
import { useFileSystemStore } from '../../lib/store/fileSystem'
import { useGitHubStore } from '../../lib/store/gitHubStore'
import { useGitStore } from '../../lib/store/gitStore'
import { mountProjectFiles } from '../../webcontainer/mountManager'
import { lazyLoadFile } from '../../lib/filesystem/lazyLoader'
import StorageInfo from '../../components/StorageInfo'

export default function WorkspaceList() {
  const workspaces = useWorkspaceStore(s => s.workspaces)
  const activeWorkspace = useWorkspaceStore(s => s.activeWorkspace)
  const isLoading = useWorkspaceStore(s => s.isLoading)
  const loadWorkspaces = useWorkspaceStore(s => s.loadWorkspaces)
  const createWorkspace = useWorkspaceStore(s => s.createWorkspace)
  const setActiveWorkspace = useWorkspaceStore(s => s.setActiveWorkspace)
  const closeWorkspace = useWorkspaceStore(s => s.closeWorkspace)
  const deleteWorkspace = useWorkspaceStore(s => s.deleteWorkspace)

  const openWorkspace = useWorkspaceStore(s => s.openWorkspace)
  const workspace = useWorkspaceStore(s => s.workspace)

  const loadTree = useFileSystemStore(s => s.loadTree)
  const clearCache = useFileSystemStore(s => s.clearCache)

  const { isAuthenticated, user, login, logout, fetchRepos, repos } = useGitHubStore()
  const cloneRepo = useGitStore(s => s.cloneRepo)

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRepoUrl, setNewRepoUrl] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [selectedRepo, setSelectedRepo] = useState('')

  useEffect(() => {
    void loadWorkspaces()
    if (isAuthenticated) {
      void fetchRepos()
    }
  }, [loadWorkspaces, isAuthenticated, fetchRepos])

  const handleOpenWorkspace = useCallback(async (workspace: import('../../types').Workspace) => {
    setActiveWorkspace(workspace)
    const ws = await openWorkspace(workspace.id)
    if (ws) {
      await loadTree(workspace.id)
    }
  }, [setActiveWorkspace, openWorkspace, loadTree])

  const handleCloseWorkspace = useCallback(async () => {
    clearCache()
    closeWorkspace()
  }, [clearCache, closeWorkspace])

  const handleCreateWorkspace = useCallback(async () => {
    if (!newName.trim()) return
    const repoUrl = selectedRepo || newRepoUrl.trim() || undefined
    const workspace = await createWorkspace(newName.trim(), repoUrl, newDescription.trim() || undefined)
    if (workspace && repoUrl) {
      await cloneRepo(repoUrl, workspace.id)
    }
    if (workspace) {
      await handleOpenWorkspace(workspace)
    }
    setShowNew(false)
    setNewName('')
    setNewRepoUrl('')
    setNewDescription('')
    setSelectedRepo('')
  }, [newName, newRepoUrl, newDescription, selectedRepo, createWorkspace, cloneRepo, handleOpenWorkspace])

  return (
    <div className="p-4 h-full overflow-auto bg-white">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">ワークスペース</h2>
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 新規
          </button>
        </div>

        {/* GitHub Auth */}
        <div className="mb-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
              <span className="text-gray-600">{user.login}</span>
              <button
                type="button"
                onClick={logout}
                className="ml-auto text-xs text-red-500 hover:text-red-600"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="w-full p-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              GitHub でログイン
            </button>
          )}
        </div>

        {/* New Workspace Form */}
        {showNew && (
          <div className="mb-3 p-3 border border-gray-200 rounded-lg space-y-2">
            <input
              className="w-full p-2 text-sm border rounded"
              placeholder="ワークスペース名 *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <input
              className="w-full p-2 text-sm border rounded"
              placeholder="説明 (任意)"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
            />

            {isAuthenticated && repos.length > 0 && (
              <select
                className="w-full p-2 text-sm border rounded"
                value={selectedRepo}
                onChange={e => setSelectedRepo(e.target.value)}
              >
                <option value="">GitHub リポジトリを選択 (任意)</option>
                {repos.map(r => (
                  <option key={r.id} value={r.clone_url || r.html_url}>
                    {r.full_name}
                  </option>
                ))}
              </select>
            )}

            <input
              className="w-full p-2 text-sm border rounded"
              placeholder="またはリポジトリURL (任意)"
              value={newRepoUrl}
              onChange={e => setNewRepoUrl(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleCreateWorkspace()}
                disabled={!newName.trim()}
                className="flex-1 p-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                作成
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="px-3 p-2 border rounded text-sm text-gray-500"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Workspace */}
      {activeWorkspace && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-blue-900">{activeWorkspace.name}</div>
              {activeWorkspace.repo_url && (
                <div className="text-xs text-blue-600 truncate">{activeWorkspace.repo_url}</div>
              )}
            </div>
            <button
              type="button"
              onClick={handleCloseWorkspace}
              className="text-xs text-red-500 hover:text-red-600 px-2 py-1"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* Workspace List */}
      {isLoading ? (
        <div className="text-sm text-gray-400 text-center py-4">読み込み中...</div>
      ) : (
        <div className="space-y-2">
          {workspaces.length === 0 && !activeWorkspace && (
            <div className="text-sm text-gray-400 text-center py-8">
              ワークスペースがありません。「+ 新規」から作成してください
            </div>
          )}
          {workspaces
            .filter(w => !activeWorkspace || w.id !== activeWorkspace.id)
            .map(workspace => (
              <div
                key={workspace.id}
                className="p-3 border border-gray-100 rounded-lg hover:border-gray-200 cursor-pointer transition-colors"
                onClick={() => void handleOpenWorkspace(workspace)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{workspace.name}</div>
                    {workspace.description && (
                      <div className="text-xs text-gray-400 mt-0.5">{workspace.description}</div>
                    )}
                    {workspace.repo_url && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{workspace.repo_url}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      if (confirm(`Delete "${workspace.name}"?`)) {
                        void deleteWorkspace(workspace.id)
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="mt-6">
        <StorageInfo />
      </div>
    </div>
  )
}
