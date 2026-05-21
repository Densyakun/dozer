'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from './idbStorage'
import type { Project } from '../../types'

type ProjectState = {
  projects: Project[]
  activeProject: Project | null
  isLoading: boolean
  error: string | null

  loadProjects: () => Promise<void>
  createProject: (name: string, repoUrl?: string, description?: string) => Promise<Project | null>
  setActiveProject: (project: Project) => void
  closeProject: () => void
  deleteProject: (id: string) => Promise<void>
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${err.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProject: null,
      isLoading: false,
      error: null,

      loadProjects: async () => {
        const { projects: existing } = get()
        set({ isLoading: true, error: null })
        try {
          const projects = await api<Project[]>('/api/projects')
          if (projects.length > 0) {
            const active = projects.find(p => p.is_active) ?? null
            set({ projects, activeProject: active, isLoading: false })
          } else {
            set({ isLoading: false })
          }
        } catch (err) {
          set({ error: String(err), isLoading: false })
        }
      },

      createProject: async (name, repoUrl, description) => {
        try {
          const project = await api<Project>('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, repo_url: repoUrl, description }),
          })
          set(s => ({ projects: [...s.projects, project] }))
          return project
        } catch (err) {
          set({ error: String(err) })
          return null
        }
      },

      setActiveProject: (project) => {
        set({ activeProject: project })
        void api('/api/projects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: project.id, is_active: true }),
        })
      },

      closeProject: () => {
        const { activeProject } = get()
        if (activeProject) {
          void api('/api/projects', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: activeProject.id, is_active: false }),
          })
        }
        set({ activeProject: null })
      },

      deleteProject: async (id) => {
        try {
          await api(`/api/projects?id=${id}`, { method: 'DELETE' })
          set(s => ({
            projects: s.projects.filter(p => p.id !== id),
            activeProject: s.activeProject?.id === id ? null : s.activeProject,
          }))
        } catch (err) {
          set({ error: String(err) })
        }
      },
    }),
    {
      name: 'project-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProject: state.activeProject,
      }) as ProjectState,
    }
  )
)
