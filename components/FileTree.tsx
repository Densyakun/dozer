import React from 'react'

export default function FileTree() {
  return (
    <div className="p-4">
      <div className="mb-2 font-semibold">ファイル</div>
      <ul className="text-sm">
        <li className="py-1">/src/App.tsx</li>
        <li className="py-1">/src/pages/index.tsx</li>
        <li className="py-1">/src/components/Hello.tsx</li>
      </ul>
    </div>
  )
}
