'use client'

import { create } from 'zustand'

export type AgentAction = {
  type: string
  path?: string
  content?: string
  command?: string
}

export type AgentMessage = {
  id: string
  role: 'user' | 'agent' | 'system'
  content: string
  actions?: AgentAction[]
  timestamp: number
}

export type AgentState = {
  messages: AgentMessage[]
  status: 'idle' | 'thinking' | 'executing' | 'error'
  isConnected: boolean
  model: string
  
  addMessage: (msg: Omit<AgentMessage, 'id' | 'timestamp'>) => void
  setStatus: (status: AgentState['status']) => void
  setConnected: (connected: boolean, model?: string) => void
  clearMessages: () => void
}

export const useAgentStore = create<AgentState>((set) => ({
  messages: [],
  status: 'idle',
  isConnected: false,
  model: 'unknown',
  
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    }]
  })),
  
  setStatus: (status) => set({ status }),
  
  setConnected: (connected, model) => set({ 
    isConnected: connected, 
    model: model ?? 'unknown' 
  }),
  
  clearMessages: () => set({ messages: [] }),
}))