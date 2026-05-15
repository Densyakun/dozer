import React from 'react'

export default function ChatPanel() {
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex-1 overflow-auto"> 
        <div className="text-sm text-gray-500">AIチャットログ</div>
      </div>
      <div className="mt-2">
        <form className="flex gap-2">
          <input aria-label="message" className="flex-1 p-3 rounded-lg border" placeholder="AIに指示を入力" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-3 rounded-lg">送信</button>
        </form>
      </div>
    </div>
  )
}
