'use client'

import { create } from 'zustand'

export type FileEntry = {
  path: string
  content: string
  type: 'file' | 'directory'
}

export type FileSystemState = {
  files: Map<string, FileEntry>
  currentFile: string | null
  setCurrentFile: (path: string | null) => void
  updateFile: (path: string, content: string) => void
  createFile: (path: string, content?: string) => void
  deleteFile: (path: string) => void
  getFile: (path: string) => FileEntry | undefined
  getAllFiles: () => FileEntry[]
}

const DEMO_FILES: FileEntry[] = [
  { path: '/src/App.tsx', content: 'export default function App() {\n  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold">Hello Dozer</h1>\n      <p className="mt-2">AI駆動開発へようこそ</p>\n    </div>\n  )\n}', type: 'file' },
  { path: '/src/index.tsx', content: 'import React from "react"\nimport ReactDOM from "react-dom/client"\nimport App from "./App"\n\nconst root = ReactDOM.createRoot(document.getElementById("root")!)\nroot.render(<App />)', type: 'file' },
  { path: '/src/components/Hello.tsx', content: 'export default function Hello() {\n  return <div className="text-blue-500">Hello Component</div>\n}', type: 'file' },
  { path: '/package.json', content: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  }\n}', type: 'file' },
]

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  files: new Map(DEMO_FILES.map(f => [f.path, f])),
  currentFile: '/src/App.tsx',
  
  setCurrentFile: (path) => set({ currentFile: path }),
  
  updateFile: (path, content) => set((state) => {
    const newFiles = new Map(state.files)
    const existing = newFiles.get(path)
    if (existing) {
      newFiles.set(path, { ...existing, content })
    } else {
      newFiles.set(path, { path, content, type: 'file' })
    }
    return { files: newFiles }
  }),
  
  createFile: (path, content = '') => set((state) => {
    const newFiles = new Map(state.files)
    newFiles.set(path, { path, content, type: 'file' })
    return { files: newFiles }
  }),
  
  deleteFile: (path) => set((state) => {
    const newFiles = new Map(state.files)
    newFiles.delete(path)
    return { 
      files: newFiles,
      currentFile: state.currentFile === path ? null : state.currentFile
    }
  }),
  
  getFile: (path) => get().files.get(path),
  
  getAllFiles: () => Array.from(get().files.values()),
}))