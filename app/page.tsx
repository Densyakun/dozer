'use client'

import React, { useState, useEffect, useCallback } from 'react'
import MobileShell, { type MobileTab } from './components/MobileShell'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../features/filesystem/FileTree'
import Preview from '../components/Preview'
import Editor from '../components/Editor'
import ProjectList from '../features/projects/ProjectList'
import GitPanel from '../features/git/GitPanel'
import WorkspaceManager from '../features/workspace/WorkspaceManager'
import SupabaseWarning from '../components/SupabaseWarning'
import { useProjectStore } from '../lib/store/projectStore'
import { useWorkspaceStore } from '../lib/store/workspaceStore'
import { useFileSystemStore } from '../lib/store/fileSystem'
import { useGitHubStore } from '../lib/store/gitHubStore'
import { lazyLoadFile } from '../lib/filesystem/lazyLoader'

type EditorTab = 'edit' | 'preview'

export default function Page() {
  const [tab, setTab] = useState<MobileTab>('projects')
  const [editorTab, setEditorTab] = useState<EditorTab>('preview')

  const activeProject = useProjectStore(s => s.activeProject)
  const workspace = useWorkspaceStore(s => s.workspace)
  const currentFile = useFileSystemStore(s => s.currentFile)
  const checkAuth = useGitHubStore(s => s.checkAuth)
  const loadRecentWorkspaces = useWorkspaceStore(s => s.loadRecentWorkspaces)

  useEffect(() => {
    void checkAuth()
    void loadRecentWorkspaces()
  }, [checkAuth, loadRecentWorkspaces])

  const handleTabChange = useCallback((newTab: MobileTab) => {
    if (newTab === 'preview' || newTab === 'files') {
      if (!activeProject) {
        setTab('projects')
        return
      }
      if (newTab === 'files' && activeProject) {
        void useFileSystemStore.getState().loadTree(activeProject.id)
      }
    }
    setTab(newTab)
  }, [activeProject])

  const handleSelectFile = useCallback(async (path: string) => {
    if (!activeProject) return
    await lazyLoadFile(activeProject.id, path)
    setTab('preview')
  }, [activeProject])

  // If no active project, show project list in all tabs except projects
  const showProjectPrompt = !activeProject && tab !== 'projects'

  return (
    <div className="flex flex-col min-h-screen">
      <SupabaseWarning />
      <MobileShell activeTab={tab} onTabChange={handleTabChange}>
        {/* Project Tab */}
        {tab === 'projects' && <ProjectList />}

        {/* Files Tab */}
        {tab === 'files' && (
          showProjectPrompt ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              プロジェクトを開いてください
            </div>
          ) : (
            <FileTree />
          )
        )}

        {/* Files Tab (tablet: side-by-side) - hidden; file tree is its own tab on mobile */}
        {/* Preview/Editor Tab */}
        {tab === 'preview' && (
          showProjectPrompt ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              プロジェクトを開いてください
            </div>
          ) : (
            <div className="h-full flex flex-col min-h-0">
              {workspace && <WorkspaceManager />}
              <div className="flex border-b border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditorTab('edit')}
                  className={`flex-1 py-2 text-sm font-medium ${editorTab === 'edit' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`flex-1 py-2 text-sm font-medium ${editorTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                >
                  プレビュー
                </button>
              </div>
              <div className="flex-1 min-h-0">
                {editorTab === 'edit' ? <Editor /> : <Preview />}
              </div>
            </div>
          )
        )}

        {/* Agent Tab */}
        {tab === 'agent' && (
          activeProject ? <ChatPanel /> : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              プロジェクトを開いてください
            </div>
          )
        )}

        {/* Git Tab */}
        {tab === 'git' && <GitPanel />}
      </MobileShell>
    </div>
  )
}
