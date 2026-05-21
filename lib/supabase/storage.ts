import { supabase } from '../supabaseClient'

const BUCKET_NAME = 'git-mirror'

export function getStoragePath(projectId: string, filePath: string): string {
  const clean = filePath.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${projectId}/${clean}`
}

export function shouldExclude(filePath: string): boolean {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts.includes('node_modules') || parts.includes('.git')
}

export async function uploadFile(
  projectId: string,
  filePath: string,
  content: string | Blob
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }
  if (shouldExclude(filePath)) return { ok: false, error: 'File excluded' }

  const storagePath = getStoragePath(projectId, filePath)
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, content, { upsert: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function downloadFile(
  projectId: string,
  filePath: string
): Promise<{ ok: boolean; content?: string; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }

  const storagePath = getStoragePath(projectId, filePath)
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath)

  if (error) return { ok: false, error: error.message }
  const text = await data.text()
  return { ok: true, content: text }
}

export async function deleteFile(
  projectId: string,
  filePath: string
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }

  const storagePath = getStoragePath(projectId, filePath)
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath])

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function listFiles(
  projectId: string,
  prefix: string = ''
): Promise<{ ok: boolean; files?: { name: string; path: string; type: 'file' | 'directory' }[]; error?: string }> {
  if (!supabase) return { ok: false, error: 'Supabase not connected' }

  const searchPrefix = prefix
    ? `${projectId}/${prefix.replace(/^\/+/, '')}`
    : projectId

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

export async function fileExists(
  projectId: string,
  filePath: string
): Promise<boolean> {
  if (!supabase) return false
  const storagePath = getStoragePath(projectId, filePath)
  const { data } = await supabase.storage
    .from(BUCKET_NAME)
    .list(storagePath)
  return data !== null && data.length > 0
}
