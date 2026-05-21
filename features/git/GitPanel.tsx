'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useGitStore } from '../../lib/store/gitStore'
import { useProjectStore } from '../../lib/store/projectStore'

export default function GitPanel() {
  const status = useGitStore(s => s.status)
  const diff = useGitStore(s => s.diff)
  const branches = useGitStore(s => s.branches)
  const currentBranch = useGitStore(s => s.currentBranch)
  const isLoading = useGitStore(s => s.isLoading)
  const error = useGitStore(s => s.error)
  const activeProject = useProjectStore(s => s.activeProject)

  const fetchStatus = useGitStore(s => s.fetchStatus)
  const fetchBranches = useGitStore(s => s.fetchBranches)
  const commit = useGitStore(s => s.commit)
  const push = useGitStore(s => s.push)
  const pull = useGitStore(s => s.pull)
  const checkoutBranch = useGitStore(s => s.checkoutBranch)
  const createBranch = useGitStore(s => s.createBranch)
  const clearError = useGitStore(s => s.clearError)
  const fetchDiff = useGitStore(s => s.fetchDiff)

  const [commitMessage, setCommitMessage] = useState('')
  const [newBranchName, setNewBranchName] = useState('')
  const [showNewBranch, setShowNewBranch] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const projectId = activeProject?.id ?? ''

  const hasGit = !!(status && status.branch)

  useEffect(() => {
    if (activeProject && !hasGit) {
      void fetchStatus(projectId)
      void fetchBranches(projectId)
    }
  }, [activeProject, fetchStatus, fetchBranches, projectId, hasGit])

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) return
    const ok = await commit(projectId, commitMessage.trim())
    if (ok) {
      setCommitMessage('')
      void fetchStatus(projectId)
    }
  }, [commitMessage, commit, projectId, fetchStatus])

  const handlePush = useCallback(async () => {
    await push(projectId)
    void fetchStatus(projectId)
  }, [push, projectId, fetchStatus])

  const handlePull = useCallback(async () => {
    await pull(projectId)
    void fetchStatus(projectId)
  }, [pull, projectId, fetchStatus])

  const handleCreateBranch = useCallback(async () => {
    if (!newBranchName.trim()) return
    const ok = await createBranch(projectId, newBranchName.trim())
    if (ok) {
      setNewBranchName('')
      setShowNewBranch(false)
      void fetchBranches(projectId)
    }
  }, [newBranchName, createBranch, projectId, fetchBranches])

  const handleSwitchBranch = useCallback(async (branch: string) => {
    await checkoutBranch(projectId, branch)
    void fetchBranches(projectId)
    void fetchStatus(projectId)
  }, [checkoutBranch, projectId, fetchBranches, fetchStatus])

  const handleShowDiff = useCallback((filePath: string) => {
    setSelectedFile(filePath === selectedFile ? null : filePath)
    if (filePath !== selectedFile) {
      void fetchDiff(projectId, filePath)
    }
  }, [selectedFile, fetchDiff, projectId])

  if (!activeProject) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-sm text-gray-400 bg-white">
        プロジェクトを開いてください
      </div>
    )
  }

  if (!hasGit) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-sm text-gray-400 bg-white">
        <p className="text-gray-500 mb-1">Git リポジトリが利用できません</p>
        <p className="text-xs text-gray-400">リポジトリをクローンしてください</p>
      </div>
    )
  }

  return (
    <div className="p-4 h-full overflow-auto bg-white">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900 text-sm">Git</h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handlePull}
              disabled={isLoading}
              className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Pull
            </button>
            <button
              type="button"
              onClick={handlePush}
              disabled={isLoading}
              className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Push
            </button>
          </div>
        </div>

        {/* Branch Info */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded text-sm">
          <span className="text-gray-500">ブランチ:</span>
          <span className="font-medium text-gray-800">{currentBranch}</span>
          {status && (
            <span className="text-xs text-gray-400 ml-auto">
              ↑{status.ahead} ↓{status.behind}
            </span>
          )}
        </div>

        {/* Branch Selector */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1 mb-1">
            {branches.map(b => (
              <button
                key={b}
                type="button"
                onClick={() => void handleSwitchBranch(b)}
                className={`px-2 py-0.5 text-xs rounded ${
                  b === currentBranch
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowNewBranch(!showNewBranch)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            + 新しいブランチ
          </button>
          {showNewBranch && (
            <div className="flex gap-1 mt-1">
              <input
                className="flex-1 p-1 text-xs border rounded"
                placeholder="branch name"
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => void handleCreateBranch()}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
              >
                作成
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
            {error}
            <button type="button" onClick={clearError} className="ml-2 text-red-500">✕</button>
          </div>
        )}

        {/* Changed Files */}
        {status && status.files.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-1">
              変更ファイル ({status.files.length})
            </div>
            <div className="space-y-0.5">
              {status.files.map(f => (
                <div key={f.path}>
                  <button
                    type="button"
                    onClick={() => handleShowDiff(f.path)}
                    className="w-full flex items-center gap-2 p-1.5 text-xs rounded hover:bg-gray-50 text-left"
                  >
                    <span className={`shrink-0 px-1 py-0.5 rounded text-[10px] font-medium ${
                      f.index === 'modified' ? 'bg-yellow-100 text-yellow-700' :
                      f.index === 'added' ? 'bg-green-100 text-green-700' :
                      f.index === 'deleted' ? 'bg-red-100 text-red-700' :
                      f.index === 'untracked' ? 'bg-gray-100 text-gray-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {f.index === 'untracked' ? 'U' : f.index.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{f.path}</span>
                  </button>
                  {selectedFile === f.path && diff && (
                    <div className="ml-4 p-2 bg-gray-50 rounded text-xs font-mono overflow-x-auto">
                      {diff.hunks.map((hunk, i) => (
                        <div key={i}>
                          <div className="text-gray-400 py-1">
                            @@ -{hunk.oldStart} +{hunk.newStart} @@
                          </div>
                          {hunk.lines.map((line, j) => (
                            <div
                              key={j}
                              className={`${
                                line.type === 'add' ? 'bg-green-50 text-green-800' :
                                line.type === 'remove' ? 'bg-red-50 text-red-800' :
                                'text-gray-600'
                              } px-1`}
                            >
                              {line.content}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {status && status.files.length === 0 && (
          <div className="text-xs text-gray-400 mb-3">変更はありません</div>
        )}

        {/* Commit */}
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 text-sm border rounded"
            placeholder="コミットメッセージ"
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleCommit() }}
          />
          <button
            type="button"
            onClick={handleCommit}
            disabled={isLoading || !commitMessage.trim()}
            className="px-3 py-2 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            コミット
          </button>
        </div>
      </div>
    </div>
  )
}
