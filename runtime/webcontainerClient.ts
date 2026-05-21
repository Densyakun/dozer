'use client'

export type WebContainerStatus = {
  ready: boolean
  error?: string
  mounts?: number
}

export type WebContainerInstance = {
  status: WebContainerStatus
  mount: (files: Record<string, { file: { contents: string } }>) => Promise<void>
  writeFile: (path: string, contents: string) => Promise<void>
  readFile: (path: string) => Promise<string>
  spawn: (command: string, args?: string[]) => Promise<{ exit: Promise<number> }>
}

let instance: WebContainerInstance | null = null
let isLoading = false
let error: string | null = null

export async function startWebContainer(): Promise<WebContainerInstance> {
  if (instance) return instance
  if (isLoading) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (instance) {
          clearInterval(check)
          resolve(instance)
        }
      }, 100)
    })
  }
  
  isLoading = true
  error = null
  
  try {
    const { WebContainer } = await import('@webcontainer/api')
    
    const wc = await WebContainer.boot()
    
    instance = {
      status: { ready: true, mounts: 0 },
      mount: async (files) => {
        await wc.mount(files)
        instance!.status.mounts = (instance!.status.mounts ?? 0) + 1
      },
      writeFile: async (path, contents) => {
        await wc.fs.writeFile(path, contents)
      },
      readFile: async (path) => {
        return await wc.fs.readFile(path, 'utf-8')
      },
      spawn: async (command, args = []) => {
        const process = await wc.spawn(command, args)
        return { exit: process.exit }
      },
    }
    
    return instance
  } catch (err) {
    error = err instanceof Error ? err.message : String(err)
    isLoading = false
    
    return {
      status: { ready: false, error },
      mount: async () => { throw new Error('WebContainer not available') },
      writeFile: async () => { throw new Error('WebContainer not available') },
      readFile: async () => { throw new Error('WebContainer not available') },
      spawn: async () => { throw new Error('WebContainer not available') },
    }
  }
}

export async function getWebContainer(): Promise<WebContainerInstance | null> {
  if (instance) return instance
  if (typeof window === 'undefined') return null
  
  try {
    return await startWebContainer()
  } catch {
    return null
  }
}

export function isWebContainerAvailable(): boolean {
  return typeof window !== 'undefined' && 
         !window.location.hostname.includes('localhost') === false &&
         window.isSecureContext
}

export const WEBCONTAINER_NOTE = 'WebContainerはHTTPS環境とsame-originで動作します。localhostでは制限される場合があります。'