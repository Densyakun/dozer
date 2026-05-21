'use client'

import { useFileSystemStore } from '../store/fileSystem'
import { mountFiles } from '../../webcontainer/mountManager'

const contentCache = new Map<string, string>()
const loadingFiles = new Set<string>()

export async function lazyLoadFile(
  projectId: string,
  path: string
): Promise<string | null> {
  if (contentCache.has(path)) {
    return contentCache.get(path)!
  }

  if (loadingFiles.has(path)) {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (contentCache.has(path)) {
          clearInterval(check)
          resolve(contentCache.get(path)!)
        }
      }, 50)
      setTimeout(() => {
        clearInterval(check)
        resolve(null)
      }, 10000)
    })
  }

  loadingFiles.add(path)

  try {
    const store = useFileSystemStore.getState()
    const content = await store.loadFileContent(projectId, path)

    if (content !== null) {
      contentCache.set(path, content)
      store.updateFileContent(path, content)

      void mountFiles([{ path, content }])
    }

    return content
  } finally {
    loadingFiles.delete(path)
  }
}

export function getCachedContent(path: string): string | undefined {
  return contentCache.get(path)
}

export function updateCache(path: string, content: string): void {
  contentCache.set(path, content)
}

export function clearCache(): void {
  contentCache.clear()
}
