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

  fetchStatus: (projectId: string) => Promise<void>
  fetchDiff: (projectId: string, filePath: string) => Promise<void>
  fetchBranches: (projectId: string) => Promise<void>
  commit: (projectId: string, message: string) => Promise<boolean>
  push: (projectId: string) => Promise<boolean>
  pull: (projectId: string) => Promise<boolean>
  checkoutBranch: (projectId: string, branch: string) => Promise<boolean>
  createBranch: (projectId: string, name: string) => Promise<boolean>
  cloneRepo: (repoUrl: string, projectId: string) => Promise<boolean>
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

      fetchStatus: async (projectId) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api<{ status: GitStatus }>(`/api/git/status?projectId=${projectId}`)
          set({ status: data.status, isLoading: false, currentBranch: data.status.branch })
        } catch (err) {
          set({ status: null, error: String(err), isLoading: false })
        }
      },

      fetchDiff: async (projectId, filePath) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api<{ diff: GitDiff }>(`/api/git/diff?projectId=${projectId}&file=${encodeURIComponent(filePath)}`)
          set({ diff: data.diff, isLoading: false })
        } catch (err) {
          set({ error: String(err), isLoading: false })
        }
      },

      fetchBranches: async (projectId) => {
        try {
          const data = await api<{ branches: string[]; current: string }>(`/api/git/branch?projectId=${projectId}`)
          set({ branches: data.branches, currentBranch: data.current })
        } catch {
          // silent
        }
      },

      commit: async (projectId, message) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/commit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, message }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      push: async (projectId) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      pull: async (projectId) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      checkoutBranch: async (projectId, branch) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/branch`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, branch, action: 'checkout' }),
          })
          set({ currentBranch: branch, isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      createBranch: async (projectId, name) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/branch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, name }),
          })
          set({ isLoading: false })
          return true
        } catch (err) {
          set({ error: String(err), isLoading: false })
          return false
        }
      },

      cloneRepo: async (repoUrl, projectId) => {
        set({ isLoading: true, error: null })
        try {
          await api(`/api/git/clone`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl, projectId }),
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
