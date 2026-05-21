'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from './idbStorage'
import type { Workspace } from '../../types'

type WorkspaceState = {
  workspace: Workspace | null
  recentWorkspaces: Workspace[]
  isLoading: boolean

  openWorkspace: (projectId: string) => Promise<Workspace | null>
  closeWorkspace: () => Promise<void>
  addOpenedFile: (path: string) => void
  removeOpenedFile: (path: string) => void
  setActiveTab: (path: string) => void
  updateEditorState: (state: Record<string, unknown>) => void
  updatePreviewState: (state: Record<string, unknown>) => void
  loadRecentWorkspaces: () => Promise<void>
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${err.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspace: null,
      recentWorkspaces: [],
      isLoading: false,

      openWorkspace: async (projectId) => {
        set({ isLoading: true })
        try {
          const workspace = await api<Workspace>('/api/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId }),
          })
          set({ workspace, isLoading: false })
          return workspace
        } catch (err) {
          set({ isLoading: false })
          return null
        }
      },

      closeWorkspace: async () => {
        const { workspace } = get()
        if (workspace) {
          set({ workspace: null })
        }
      },

      addOpenedFile: (path) => {
        const { workspace } = get()
        if (!workspace) return
        if (workspace.opened_files.includes(path)) return
        const updated = { ...workspace, opened_files: [...workspace.opened_files, path], active_tab: path }
        set({ workspace: updated })
      },

      removeOpenedFile: (path) => {
        const { workspace } = get()
        if (!workspace) return
        const updated = {
          ...workspace,
          opened_files: workspace.opened_files.filter(f => f !== path),
          active_tab: workspace.active_tab === path ? workspace.opened_files[0] : workspace.active_tab,
        }
        set({ workspace: updated })
      },

      setActiveTab: (path) => {
        const { workspace } = get()
        if (!workspace) return
        set({ workspace: { ...workspace, active_tab: path } })
      },

      updateEditorState: (state) => {
        const { workspace } = get()
        if (!workspace) return
        set({ workspace: { ...workspace, editor_state: state } })
      },

      updatePreviewState: (state) => {
        const { workspace } = get()
        if (!workspace) return
        set({ workspace: { ...workspace, preview_state: state } })
      },

      loadRecentWorkspaces: async () => {
        try {
          const workspaces = await api<Workspace[]>('/api/workspaces?recent=true')
          set({ recentWorkspaces: workspaces })
        } catch {
          // silent
        }
      },
    }),
    {
      name: 'workspace-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        workspace: state.workspace,
        recentWorkspaces: state.recentWorkspaces,
      }) as WorkspaceState,
    }
  )
)
