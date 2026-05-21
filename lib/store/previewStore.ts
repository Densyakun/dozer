'use client'

import { create } from 'zustand'

export type PreviewState = {
  mode: 'light' | 'heavy'
  html: string
  isLoading: boolean
  error: string | null
  
  setMode: (mode: 'light' | 'heavy') => void
  setHtml: (html: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clear: () => void
}

export const usePreviewStore = create<PreviewState>((set) => ({
  mode: 'light',
  html: '<!doctype html><html><body><div id="root"><p class="p-4">プレビューを開始してください</p></div></body></html>',
  isLoading: false,
  error: null,
  
  setMode: (mode) => set({ mode }),
  setHtml: (html) => set({ html, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () => set({ html: '', error: null }),
}))