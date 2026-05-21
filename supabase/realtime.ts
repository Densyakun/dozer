'use client'

import { supabase } from '../lib/supabaseClient'
import { useFileSystemStore, type FileEntry } from '../lib/store/fileSystem'

export type FileChange = {
  id: string
  path: string
  content: string
  timestamp: number
  userId?: string
}

export type RealtimeChannel = {
  unsubscribe: () => void
  send: (event: string, payload: Record<string, unknown>) => Promise<void>
}

let currentChannel: RealtimeChannel | null = null

export function subscribeFiles(
  onFileChange?: (change: FileChange) => void,
  onError?: (error: Error) => void
): RealtimeChannel {
  if (!supabase) {
    const stubChannel: RealtimeChannel = {
      unsubscribe: () => {},
      send: async () => {},
    }
    return stubChannel
  }
  
  if (currentChannel) {
    currentChannel.unsubscribe()
  }
  
  const channel = supabase.channel('files-channel')
  
  channel
    .on('broadcast', { event: 'file-change' }, (payload) => {
      const change = payload.payload as FileChange
      onFileChange?.(change)
      
      useFileSystemStore.getState().updateFile(change.path, change.content)
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime channel subscribed')
      } else if (status === 'CHANNEL_ERROR') {
        onError?.(new Error('Channel subscription failed'))
      }
    })
  
  currentChannel = {
    unsubscribe: () => {
      void supabase.removeChannel(channel)
      currentChannel = null
    },
    send: async (event, payload) => {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      })
    },
  }
  
  return currentChannel
}

export async function broadcastFileChange(file: FileEntry): Promise<void> {
  if (!currentChannel) return
  
  const change: FileChange = {
    id: crypto.randomUUID(),
    path: file.path,
    content: file.content,
    timestamp: Date.now(),
  }
  
  await currentChannel.send('file-change', change)
}

export function unsubscribeFiles(): void {
  if (currentChannel) {
    currentChannel.unsubscribe()
    currentChannel = null
  }
}

export function isRealtimeEnabled(): boolean {
  return supabase !== null
}