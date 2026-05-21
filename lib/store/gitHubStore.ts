'use client'

import { create } from 'zustand'
import type { GitHubUser, GitHubRepo } from '../../types'

type GitHubState = {
  user: GitHubUser | null
  repos: GitHubRepo[]
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  accessToken: string | null

  login: () => void
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  fetchRepos: () => Promise<void>
  setToken: (token: string) => void
  checkAuth: () => Promise<void>
}

export const useGitHubStore = create<GitHubState>((set, get) => ({
  user: null,
  repos: [],
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: null,

  login: () => {
    const redirectUri = `${window.location.origin}/api/github/oauth/callback`
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? ''
    if (!clientId) {
      set({ error: 'GitHub Client ID not configured' })
      return
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo,user',
    })
    window.location.href = `https://github.com/login/oauth/authorize?${params}`
  },

  logout: async () => {
    set({ user: null, repos: [], isAuthenticated: false, accessToken: null })
    await fetch('/api/github/oauth/logout', { method: 'POST' })
  },

  fetchUser: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await fetch('/api/github/user').then(r => r.json()) as { user: GitHubUser }
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  fetchRepos: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await fetch('/api/github/repos').then(r => r.json()) as { repos: GitHubRepo[] }
      set({ repos: data.repos, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
    }
  },

  setToken: (token) => {
    set({ accessToken: token, isAuthenticated: true })
  },

  checkAuth: async () => {
    try {
      const data = await fetch('/api/github/oauth/status').then(r => r.json()) as { authenticated: boolean; user?: GitHubUser }
      if (data.authenticated && data.user) {
        set({ isAuthenticated: true, user: data.user })
      }
    } catch {
      // not authenticated
    }
  },
}))
