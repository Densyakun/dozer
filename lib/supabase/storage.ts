import { supabase } from '../supabaseClient'

const BUCKET_NAME = 'git-mirror'

export function getStoragePath(workspaceId: string, filePath: string): string {
  const clean = filePath.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${workspaceId}/${clean}`
}

export function shouldExclude(filePath: string): boolean {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts.includes('node_modules') || parts.includes('.git')
}

export function shouldExcludeNodeModulesOnly(filePath: string): boolean {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts.includes('node_modules')
}

export async function uploadFile(
  workspaceId: string,
  filePath: string,
  content: string | Blob,
  force = false
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }
  if (!force && shouldExclude(filePath)) return { ok: false, error: 'File excluded' }

  const storagePath = getStoragePath(workspaceId, filePath)
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, content, { upsert: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function downloadFile(
  workspaceId: string,
  filePath: string,
  force = false
): Promise<{ ok: boolean; content?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }
  if (!force && shouldExclude(filePath)) return { ok: false, error: 'File excluded' }

  const storagePath = getStoragePath(workspaceId, filePath)
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath)

  if (error) return { ok: false, error: error.message }
  const text = await data.text()
  return { ok: true, content: text }
}

export async function deleteFile(
  workspaceId: string,
  filePath: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }

  const storagePath = getStoragePath(workspaceId, filePath)
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath])

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function downloadBinary(
  workspaceId: string,
  filePath: string
): Promise<{ ok: boolean; buffer?: Buffer; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }

  const storagePath = getStoragePath(workspaceId, filePath)
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath)

  if (error) return { ok: false, error: error.message }
  const arrayBuf = await data.arrayBuffer()
  const { Buffer } = await import('buffer')
  return { ok: true, buffer: Buffer.from(arrayBuf) }
}

export async function fileExists(
  workspaceId: string,
  filePath: string
): Promise<boolean> {
  if (!supabase) return false
  const storagePath = getStoragePath(workspaceId, filePath)
  const { data } = await supabase.storage
    .from(BUCKET_NAME)
    .list(storagePath)
  return data !== null && data.length > 0
}

export async function listFiles(
  workspaceId: string,
  prefix: string = ''
): Promise<{ ok: boolean; files?: { name: string; path: string; type: 'file' | 'directory' }[]; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }

  const searchPrefix = prefix
    ? `${workspaceId}/${prefix.replace(/^\/+/, '')}`
    : workspaceId

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(searchPrefix, { limit: 1000 })

  if (error) return { ok: false, error: error.message }

  const files = data
    .filter(f => !shouldExclude(f.name))
    .map(f => ({
      name: f.name,
      path: `/${prefix ? prefix + '/' : ''}${f.name}`,
      type: (f.metadata?.mimetype === 'application/octet-stream' || !f.id) ? 'directory' as const : 'file' as const,
    }))

  return { ok: true, files }
}

async function listAllRecursive(
  workspaceId: string,
  prefix: string = '',
  excludeGit = false
): Promise<{ path: string; name: string }[]> {
  if (!supabase) return []

  const searchPrefix = prefix
    ? `${workspaceId}/${prefix.replace(/^\/+/, '')}`
    : workspaceId

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(searchPrefix, { limit: 1000 })

  if (error || !data) return []

  const result: { path: string; name: string }[] = []

  for (const item of data) {
    if (item.name === 'node_modules') continue

    if (excludeGit && item.name === '.git') continue

    const itemPath = prefix ? `${prefix}/${item.name}` : item.name
    const isDirectory = !item.id

    if (isDirectory) {
      const children = await listAllRecursive(workspaceId, itemPath, excludeGit)
      result.push(...children)
    } else {
      result.push({ path: itemPath, name: item.name })
    }
  }

  return result
}

export async function listWorkspaceFiles(
  workspaceId: string
): Promise<{ path: string; name: string }[]> {
  return listAllRecursive(workspaceId, '', true)
}

export async function listAllFiles(
  workspaceId: string
): Promise<{ path: string; name: string }[]> {
  return listAllRecursive(workspaceId, '', false)
}
