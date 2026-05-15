import React from 'react'

export type VFile = { path: string; content: string }

const DEMO_FILES: VFile[] = [
  { path: '/src/App.tsx', content: '// virtual file' },
  { path: '/src/pages/index.tsx', content: '// virtual file' },
  { path: '/src/components/Hello.tsx', content: '// virtual file' },
]

type FileTreeProps = {
  files?: VFile[]
  onOpen?: (path: string) => void
}

export default function FileTree({ files = DEMO_FILES, onOpen }: FileTreeProps) {
  return (
    <div className="p-4 h-full overflow-auto bg-white">
      <div className="mb-3 font-semibold text-gray-900">ファイル</div>
      <ul className="text-sm space-y-1">
        {files.map((f) => (
          <li key={f.path}>
            <button
              type="button"
              className="w-full text-left py-2 px-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 active:bg-gray-100"
              onClick={() => onOpen?.(f.path)}
            >
              {f.path}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
