import React from 'react'

export default function Page() {
  return (
    <main className="p-4 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold">Dozer</h1>
      <p className="mt-2 text-sm text-gray-600">Mobile-first AI development environment</p>
    </main>
  )
}
import React from 'react'
import ChatPanel from '../components/ChatPanel'
import FileTree from '../components/FileTree'
import Preview from '../components/Preview'

export default function Page() {
  return (
    <main className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row">
          <div className="w-full md:w-80 border-r bg-white">
            <FileTree />
          </div>
          <div className="flex-1 p-2 overflow-auto">
            <Preview />
          </div>
        </div>
      </div>
      <div className="h-80 border-t bg-white">
        <ChatPanel />
      </div>
    </main>
  )
}
