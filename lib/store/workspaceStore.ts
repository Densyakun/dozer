'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from './idbStorage'
import type { Workspace } from '../../types'

type WorkspaceState = {
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  workspace: Workspace | null
  recentWorkspaces: Workspace[]
  isLoading: boolean
  error: string | null

  loadWorkspaces: () => Promise<void>
  createWorkspace: (name: string, repoUrl?: string, description?: string) => Promise<Workspace | null>
  setActiveWorkspace: (workspace: Workspace) => void
  closeWorkspace: () => void
  deleteWorkspace: (id: string) => Promise<void>
  openWorkspace: (workspaceId: string) => Promise<Workspace | null>
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
      workspaces: [],
      activeWorkspace: null,
      workspace: null,
      recentWorkspaces: [],
      isLoading: false,
      error: null,

      loadWorkspaces: async () => {
        const { workspaces: existing } = get()
        set({ isLoading: true, error: null })
        try {
          const workspaces = await api<Workspace[]>('/api/workspaces')
          if (workspaces.length > 0) {
            const active = workspaces.find(w => w.is_active) ?? null
            set({ workspaces, activeWorkspace: active, isLoading: false })
          } else {
            set({ isLoading: false })
          }
        } catch (err) {
          set({ error: String(err), isLoading: false })
        }
      },

      createWorkspace: async (name, repoUrl, description) => {
        try {
          const workspace = await api<Workspace>('/api/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, repo_url: repoUrl, description }),
          })
          set(s => ({ workspaces: [...s.workspaces, workspace] }))
          return workspace
        } catch (err) {
          set({ error: String(err) })
          return null
        }
      },

      setActiveWorkspace: (workspace) => {
        set({ activeWorkspace: workspace })
        void api('/api/workspaces', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: workspace.id, is_active: true }),
        })
      },

      closeWorkspace: () => {
        const { activeWorkspace } = get()
        if (activeWorkspace) {
          void api('/api/workspaces', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeWorkspace.id, is_active: false }),
          })
        }
        set({ workspace: null, activeWorkspace: null })
      },

      deleteWorkspace: async (id) => {
        try {
          await api(`/api/workspaces?id=${id}`, { method: 'DELETE' })
          set(s => ({
            workspaces: s.workspaces.filter(w => w.id !== id),
            activeWorkspace: s.activeWorkspace?.id === id ? null : s.activeWorkspace,
          }))
        } catch (err) {
          set({ error: String(err) })
        }
      },

      openWorkspace: async (workspaceId) => {
        set({ isLoading: true })
        try {
          const workspace = await api<Workspace>('/api/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspace_id: workspaceId }),
          })
          set({ workspace, isLoading: false })
          return workspace
        } catch (err) {
          set({ isLoading: false })
          return null
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
        workspaces: state.workspaces,
        activeWorkspace: state.activeWorkspace,
        workspace: state.workspace,
        recentWorkspaces: state.recentWorkspaces,
      }) as WorkspaceState,
    }
  )
)
