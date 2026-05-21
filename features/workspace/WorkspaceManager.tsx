'use client'

import React from 'react'
import { useWorkspaceStore } from '../../lib/store/workspaceStore'

export default function WorkspaceManager() {
  const workspace = useWorkspaceStore(s => s.workspace)
  const recentWorkspaces = useWorkspaceStore(s => s.recentWorkspaces)
  const addOpenedFile = useWorkspaceStore(s => s.addOpenedFile)
  const setActiveTab = useWorkspaceStore(s => s.setActiveTab)

  if (!workspace) return null

  return (
    <div className="p-2 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-1 overflow-x-auto">
        {workspace.opened_files.map(file => {
          const fileName = file.split('/').pop() || file
          const isActive = workspace.active_tab === file
          return (
            <button
              key={file}
              type="button"
              onClick={() => setActiveTab(file)}
              className={`shrink-0 px-3 py-1.5 text-xs rounded-t transition-colors ${
                isActive
                  ? 'bg-white text-blue-600 border border-b-white border-gray-200 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {fileName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
