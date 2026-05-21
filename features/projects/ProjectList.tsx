'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useProjectStore } from '../../lib/store/projectStore'
import { useWorkspaceStore } from '../../lib/store/workspaceStore'
import { useFileSystemStore } from '../../lib/store/fileSystem'
import { useGitHubStore } from '../../lib/store/gitHubStore'
import { useGitStore } from '../../lib/store/gitStore'
import { mountProjectFiles } from '../../webcontainer/mountManager'
import { lazyLoadFile } from '../../lib/filesystem/lazyLoader'
import StorageInfo from '../../components/StorageInfo'

export default function ProjectList() {
  const projects = useProjectStore(s => s.projects)
  const activeProject = useProjectStore(s => s.activeProject)
  const isLoading = useProjectStore(s => s.isLoading)
  const loadProjects = useProjectStore(s => s.loadProjects)
  const createProject = useProjectStore(s => s.createProject)
  const setActiveProject = useProjectStore(s => s.setActiveProject)
  const closeProject = useProjectStore(s => s.closeProject)
  const deleteProject = useProjectStore(s => s.deleteProject)

  const openWorkspace = useWorkspaceStore(s => s.openWorkspace)
  const closeWorkspace = useWorkspaceStore(s => s.closeWorkspace)
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
    void loadProjects()
    if (isAuthenticated) {
      void fetchRepos()
    }
  }, [loadProjects, isAuthenticated, fetchRepos])

  const handleOpenProject = useCallback(async (project: import('../../types').Project) => {
    setActiveProject(project)
    const ws = await openWorkspace(project.id)
    if (ws) {
      await loadTree(project.id)
    }
  }, [setActiveProject, openWorkspace, loadTree])

  const handleCloseProject = useCallback(async () => {
    clearCache()
    await closeWorkspace()
    closeProject()
  }, [clearCache, closeWorkspace, closeProject])

  const handleCreateProject = useCallback(async () => {
    if (!newName.trim()) return
    const repoUrl = selectedRepo || newRepoUrl.trim() || undefined
    const project = await createProject(newName.trim(), repoUrl, newDescription.trim() || undefined)
    if (project && repoUrl) {
      await cloneRepo(repoUrl, project.id)
    }
    if (project) {
      await handleOpenProject(project)
    }
    setShowNew(false)
    setNewName('')
    setNewRepoUrl('')
    setNewDescription('')
    setSelectedRepo('')
  }, [newName, newRepoUrl, newDescription, selectedRepo, createProject, cloneRepo, handleOpenProject])

  return (
    <div className="p-4 h-full overflow-auto bg-white">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">プロジェクト</h2>
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

        {/* New Project Form */}
        {showNew && (
          <div className="mb-3 p-3 border border-gray-200 rounded-lg space-y-2">
            <input
              className="w-full p-2 text-sm border rounded"
              placeholder="プロジェクト名 *"
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
                onClick={() => void handleCreateProject()}
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

      {/* Active Project */}
      {activeProject && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm text-blue-900">{activeProject.name}</div>
              {activeProject.repo_url && (
                <div className="text-xs text-blue-600 truncate">{activeProject.repo_url}</div>
              )}
            </div>
            <button
              type="button"
              onClick={handleCloseProject}
              className="text-xs text-red-500 hover:text-red-600 px-2 py-1"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* Project List */}
      {isLoading ? (
        <div className="text-sm text-gray-400 text-center py-4">読み込み中...</div>
      ) : (
        <div className="space-y-2">
          {projects.length === 0 && !activeProject && (
            <div className="text-sm text-gray-400 text-center py-8">
              プロジェクトがありません。「+ 新規」から作成してください
            </div>
          )}
          {projects
            .filter(p => !activeProject || p.id !== activeProject.id)
            .map(project => (
              <div
                key={project.id}
                className="p-3 border border-gray-100 rounded-lg hover:border-gray-200 cursor-pointer transition-colors"
                onClick={() => void handleOpenProject(project)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-gray-400 mt-0.5">{project.description}</div>
                    )}
                    {project.repo_url && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{project.repo_url}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      if (confirm(`Delete "${project.name}"?`)) {
                        void deleteProject(project.id)
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
