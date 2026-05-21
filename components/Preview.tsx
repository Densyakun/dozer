'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useFileSystemStore } from '../lib/store/fileSystem'
import { usePreviewStore } from '../lib/store/previewStore'
import { safeRenderTsx } from '../evaluator/tsxSafeEval'

export default function Preview() {
  const mode = usePreviewStore(s => s.mode)
  const setMode = usePreviewStore(s => s.setMode)
  const html = usePreviewStore(s => s.html)
  const setHtml = usePreviewStore(s => s.setHtml)
  const isLoading = usePreviewStore(s => s.isLoading)
  const setLoading = usePreviewStore(s => s.setLoading)
  const error = usePreviewStore(s => s.error)
  const setError = usePreviewStore(s => s.setError)
  
  const currentFile = useFileSystemStore(s => s.currentFile)
  const getFile = useFileSystemStore(s => s.getFile)
  
  const [srcDoc, setSrcDoc] = useState(html)
  
  const runPreview = useCallback(async () => {
    if (!currentFile) {
      setError('ファイルを選択してください')
      return
    }
    
    const file = getFile(currentFile)
    if (!file) {
      setError('ファイルが見つかりません')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      if (mode === 'light') {
        const result = safeRenderTsx(file.content)
        if (result.ok && result.html) {
          setSrcDoc(result.html)
          setHtml(result.html)
        } else {
          setError(result.error || '評価に失敗しました')
        }
      } else {
        setSrcDoc('<!doctype html><html><body><div class="p-4"><p>重量プレビューはWebContainerが必要です</p></div></body></html>')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [currentFile, getFile, mode, setError, setHtml, setLoading])
  
  useEffect(() => {
    if (currentFile) {
      void runPreview()
    }
  }, [currentFile, runPreview])
  
  useEffect(() => {
    setSrcDoc(html)
  }, [html])
  
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="p-2 flex items-center justify-between border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">プレビュー</span>
          <span className={`px-2 py-0.5 text-xs rounded ${mode === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
            {mode === 'light' ? '軽量' : '重量'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === 'light' ? 'heavy' : 'light')}
            className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50"
          >
            {mode === 'light' ? '重量モード' : '軽量モード'}
          </button>
          <button
            type="button"
            onClick={() => void runPreview()}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '...' : '更新'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mx-2 mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex-1 min-h-0 bg-white m-2 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <iframe
          title="preview"
          className="w-full h-full min-h-[12rem] border-0"
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  )
}