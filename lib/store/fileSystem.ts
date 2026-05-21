'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { idbStorage } from './idbStorage'
import type { FileTreeNode, FileMeta } from '../../types'

type FileSystemState = {
  tree: FileTreeNode[]
  files: Map<string, FileMeta>
  openFiles: string[]
  currentFile: string | null
  fileContents: Map<string, string>
  isLoading: boolean
  error: string | null

  setTree: (tree: FileTreeNode[]) => void
  loadTree: (workspaceId: string) => Promise<void>
  loadFileContent: (workspaceId: string, path: string) => Promise<string | null>
  getFileContent: (path: string) => string | undefined
  setCurrentFile: (path: string | null) => void
  openFile: (path: string) => void
  closeFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  createFile: (workspaceId: string, path: string, content?: string) => Promise<boolean>
  createFolder: (workspaceId: string, path: string) => Promise<boolean>
  renameFile: (workspaceId: string, oldPath: string, newPath: string) => Promise<boolean>
  deleteEntity: (workspaceId: string, path: string) => Promise<boolean>
  clearCache: () => void
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(err.slice(0, 200))
  }
  return res.json() as Promise<T>
}

function buildTree(metas: FileMeta[]): FileTreeNode[] {
  const root: FileTreeNode[] = []
  const map = new Map<string, FileTreeNode>()

  const ignoreDirs = new Set(['node_modules', '.git', '.next', 'dist', 'build'])

  for (const meta of metas) {
    if (meta.path === '/') continue
    const parts = meta.path.split('/').filter(Boolean)
    if (parts.length === 0) continue
    if (ignoreDirs.has(parts[0])) continue

    let currentPath = ''
    for (let i = 0; i < parts.length; i++) {
      const isLast = i === parts.length - 1
      currentPath += '/' + parts[i]

      if (isLast && meta.type === 'file') {
        if (!map.has(currentPath)) {
          const node: FileTreeNode = {
            path: currentPath,
            name: parts[i],
            type: 'file',
            children: [],
            size: meta.size,
          }
          map.set(currentPath, node)
        }
      } else if (!map.has(currentPath)) {
        const node: FileTreeNode = {
          path: currentPath,
          name: parts[i],
          type: 'directory',
          children: [],
          expanded: false,
        }
        map.set(currentPath, node)
      }
    }
  }

  for (const node of map.values()) {
    const parentPath = '/' + node.path.split('/').slice(1, -1).join('/')
    if (parentPath === '/') {
      root.push(node)
    } else {
      const parent = map.get(parentPath)
      if (parent && parent.type === 'directory') {
        parent.children.push(node)
      } else {
        root.push(node)
      }
    }
  }

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    for (const n of nodes) {
      if (n.children.length > 0) sortNodes(n.children)
    }
  }
  sortNodes(root)

  return root
}

export const useFileSystemStore = create<FileSystemState>()(
  persist(
    (set, get) => ({
      tree: [],
      files: new Map(),
      openFiles: [],
      currentFile: null,
      fileContents: new Map(),
      isLoading: false,
      error: null,

      setTree: (tree) => set({ tree }),

      loadTree: async (workspaceId) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api<{ files: FileMeta[] }>(`/api/files?workspaceId=${workspaceId}`)
          const files = new Map(data.files.map(f => [f.path, f]))
          const tree = buildTree(data.files)
          set({ tree, files, isLoading: false })
        } catch (err) {
          set({ error: String(err), isLoading: false })
        }
      },

      loadFileContent: async (workspaceId, path) => {
        try {
          const data = await api<{ content: string }>(`/api/files/content?workspaceId=${workspaceId}&path=${encodeURIComponent(path)}`)
          set(s => {
            const newContents = new Map(s.fileContents)
            newContents.set(path, data.content)
            return { fileContents: newContents }
          })
          return data.content
        } catch {
          return null
        }
      },

      getFileContent: (path) => get().fileContents.get(path),

      setCurrentFile: (path) => set({ currentFile: path }),

      openFile: (path) => {
        const { openFiles } = get()
        if (!openFiles.includes(path)) {
          set({ openFiles: [...openFiles, path] })
        }
        set({ currentFile: path })
      },

      closeFile: (path) => {
        const { openFiles, currentFile } = get()
        const newOpenFiles = openFiles.filter(f => f !== path)
        set({
          openFiles: newOpenFiles,
          currentFile: currentFile === path ? (newOpenFiles[0] ?? null) : currentFile,
        })
      },

      updateFileContent: (path, content) => {
        set(s => {
          const newContents = new Map(s.fileContents)
          newContents.set(path, content)
          return { fileContents: newContents }
        })
      },

      createFile: async (workspaceId, path, content = '') => {
        try {
          await api('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId, path, content, type: 'file' }),
          })
          await get().loadTree(workspaceId)
          return true
        } catch {
          return false
        }
      },

      createFolder: async (workspaceId, path) => {
        try {
          await api('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId, path: path + '/.gitkeep', content: '', type: 'directory' }),
          })
          await get().loadTree(workspaceId)
          return true
        } catch {
          return false
        }
      },

      renameFile: async (workspaceId, oldPath, newPath) => {
        try {
          await api('/api/files', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId, oldPath, newPath }),
          })
          await get().loadTree(workspaceId)
          return true
        } catch {
          return false
        }
      },

      deleteEntity: async (workspaceId, path) => {
        try {
          await api(`/api/files?workspaceId=${workspaceId}&path=${encodeURIComponent(path)}`, { method: 'DELETE' })
          set(s => {
            const newContents = new Map(s.fileContents)
            newContents.delete(path)
            return { fileContents: newContents }
          })
          await get().loadTree(workspaceId)
          return true
        } catch {
          return false
        }
      },

      clearCache: () => set({ fileContents: new Map(), openFiles: [], currentFile: null }),
    }),
    {
      name: 'file-system-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        tree: state.tree,
        openFiles: state.openFiles,
        currentFile: state.currentFile,
      }) as FileSystemState,
    }
  )
)
