'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from './idbStorage'
import type { GitStatus, GitDiff } from '../../types'

type GitState = {
  status: GitStatus | null
  diff: GitDiff | null
  branches: string[]
  currentBranch: string
  isLoading: boolean
  error: string | null

  fetchStatus: (workspaceId: string) => Promise<void>
  fetchDiff: (workspaceId: string, filePath: string) => Promise<void>
  fetchBranches: (workspaceId: string) => Promise<void>
  commit: (workspaceId: string, message: string) => Promise<boolean>
  push: (workspaceId: string) => Promise<boolean>
  pull: (workspaceId: string) => Promise<boolean>
  checkoutBranch: (workspaceId: string, branch: string) => Promise<boolean>
  createBranch: (workspaceId: string, name: string) => Promise<boolean>
  cloneRepo: (repoUrl: string, workspaceId: string) => Promise<boolean>
  clearError: () => void
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(err.slice(0, 200))
  }
  return res.json() as Promise<T>
}

export const useGitStore = create<GitState>()(
  persist(
    (set) => ({
      status: null,
      diff: null,
      branches: [],
      currentBranch: '',
      isLoading: false,
      error: null,

      fetchStatus: async (workspaceId) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api<{ status: GitStatus }>(`/api/git/status?workspaceId=${workspaceId}`)
          set({ status: data.status, isLoading: false, currentBranch: data.status.branch })
        } catch (err) {
          set({ status: null, error: String(err), isLoading: false })
        }
      },

      fetchDiff: async (workspaceId, filePath) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api<{ diff: GitDiff }>(`/api/git/diff?workspaceId=${workspaceId}&file=${encodeURIComponent(filePath)}`)
          set({ diff: data.diff, isLoading: false })
        } catch (err) {
          set({ error: String(err), isLoading: false })
        }
      },

      fetchBranches: async (workspaceId) => {
        try {
          const data = await api<{ branches: string[]; current: string }>(`/api/git/branch?workspaceId=${workspaceId}`)
          set({ branches: data.branches, currentBranch: data.current })
        } catch {
          // silent
        }
      },

      commit: async (workspaceId, message) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/commit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId, message }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      push: async (workspaceId) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      pull: async (workspaceId) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      checkoutBranch: async (workspaceId, branch) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/branch`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId, branch, action: 'checkout' }),
          })
          set({ currentBranch: branch, isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      createBranch: async (workspaceId, name) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/branch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId, name }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      cloneRepo: async (repoUrl, workspaceId) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/clone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl, workspaceId }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'git-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        status: state.status,
        branches: state.branches,
        currentBranch: state.currentBranch,
      }) as GitState,
    }
  )
)
