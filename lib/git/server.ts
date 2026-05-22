import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { supabase } from '../supabaseClient'
import {
  uploadFile, downloadFile, downloadBinary, deleteFile,
  shouldExclude, listWorkspaceFiles, listAllFiles,
} from '../supabase/storage'

async function withTempDir<T>(fn: (tmpDir: string) => Promise<T>): Promise<T> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dozer-'))
  try {
    return await fn(tmpDir)
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
}

async function downloadAllToTemp(workspaceId: string, tmpDir: string): Promise<void> {
  const allFiles = await listAllFiles(workspaceId)
  for (const file of allFiles) {
    const fullPath = path.join(tmpDir, file.path)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })

    if (file.path.startsWith('.git/') || file.path === '.git' || file.path.includes('/.git/')) {
      const result = await downloadBinary(workspaceId, file.path)
      if (result.ok && result.buffer) {
        await fs.writeFile(fullPath, result.buffer)
      }
    } else {
      const result = await downloadFile(workspaceId, file.path)
      if (result.ok && result.content !== undefined) {
        await fs.writeFile(fullPath, result.content, 'utf-8')
      }
    }
  }
}

async function uploadAllFromTemp(workspaceId: string, tmpDir: string): Promise<void> {
  async function walk(dir: string, relativePath: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === 'node_modules') continue
      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relativePath, entry.name).replace(/\\/g, '/')
      if (entry.isDirectory()) {
        await walk(fullPath, relPath)
      } else {
        const content = await fs.readFile(fullPath, 'utf-8')
        const isGitFile = relPath.startsWith('.git/') || relPath === '.git' || relPath.includes('/.git/')
        if (!isGitFile && shouldExclude(relPath)) continue
        await uploadFile(workspaceId, relPath, content, true)
      }
    }
  }
  await walk(tmpDir, '')
}

async function fileExistsLocal(dir: string, subPath: string): Promise<boolean> {
  try {
    await fs.stat(path.join(dir, subPath))
    return true
  } catch {
    return false
  }
}

async function runGit(tmpDir: string, args: string[], timeout = 30_000): Promise<string> {
  const { execSync } = await import('child_process')
  return execSync(`git -C "${tmpDir}" ${args.join(' ')}`, {
    encoding: 'utf-8',
    timeout,
    stdio: 'pipe',
  })
}

export async function shallowClone(repoUrl: string, workspaceId: string): Promise<void> {
  await withTempDir(async (tmpDir) => {
    await runGit(tmpDir, ['clone', '--depth', '1', `"${repoUrl}"`, `"${tmpDir}"`], 120_000)
    const { execSync } = await import('child_process')
    execSync(`git -C "${tmpDir}" sparse-checkout init --cone 2>/dev/null || true`, {
      stdio: 'pipe', timeout: 10_000,
    })
    await uploadAllFromTemp(workspaceId, tmpDir)
  })
}

export async function getGitStatus(workspaceId: string) {
  return withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)

    const hasGit = await fileExistsLocal(tmpDir, '.git')
    if (!hasGit) {
      return { current: '', branch: '', ahead: 0, behind: 0, files: [] }
    }

    try {
      const statusText = await runGit(tmpDir, ['status', '--porcelain=v1'], 10_000)
      const current = (await runGit(tmpDir, ['branch', '--show-current'], 5_000)).trim()
      const aheadBehind = (await runGit(tmpDir, [
        'rev-list', '--left-right', '--count',
        'HEAD...@{upstream} 2>/dev/null || echo "0 0"',
      ], 5_000)).trim()

      const [ahead, behind] = aheadBehind.split(/\s+/).map(Number)

      const files = statusText
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const index = line.slice(0, 2).trim()
          const filePath = line.slice(3).trim()
          const indexMap: Record<string, string> = {
            M: 'modified', A: 'added', D: 'deleted', R: 'renamed', '??': 'untracked',
          }
          return {
            path: filePath,
            index: indexMap[index] || 'modified',
            working_dir: 'unmodified' as const,
          }
        })

      return { current, branch: current, ahead, behind, files }
    } catch {
      return { current: '', branch: '', ahead: 0, behind: 0, files: [] }
    }
  })
}

export async function gitCommit(workspaceId: string, message: string): Promise<void> {
  await withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)

    await runGit(tmpDir, ['add', '-A'], 30_000)
    await runGit(tmpDir, ['commit', '-m', `"${message.replace(/"/g, '\\"')}"`], 30_000)

    await uploadAllFromTemp(workspaceId, tmpDir)
  })
}

export async function gitPush(workspaceId: string): Promise<void> {
  await withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)
    await runGit(tmpDir, ['push'], 60_000)
    await uploadAllFromTemp(workspaceId, tmpDir)
  })
}

export async function gitPull(workspaceId: string): Promise<void> {
  await withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)
    await runGit(tmpDir, ['pull', '--rebase'], 60_000)
    await uploadAllFromTemp(workspaceId, tmpDir)
  })
}

export async function gitCheckout(workspaceId: string, branch: string): Promise<void> {
  await withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)
    await runGit(tmpDir, ['checkout', `"${branch}"`], 30_000)
    await uploadAllFromTemp(workspaceId, tmpDir)
  })
}

export async function gitCreateBranch(workspaceId: string, name: string): Promise<void> {
  await withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)
    await runGit(tmpDir, ['checkout', '-b', `"${name}"`], 30_000)
    await uploadAllFromTemp(workspaceId, tmpDir)
  })
}

export async function gitBranches(workspaceId: string): Promise<{ branches: string[]; current: string }> {
  return withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)

    const current = (await runGit(tmpDir, ['branch', '--show-current'], 5_000)).trim()
    const list = (await runGit(tmpDir, ['branch', '--format="%(refname:short)"'], 5_000))
      .trim().split('\n').filter(Boolean)

    return { branches: list, current }
  })
}

export async function gitDiff(workspaceId: string, filePath?: string): Promise<string> {
  return withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)

    const fileArg = filePath ? ` -- "${filePath.replace(/"/g, '\\"')}"` : ''
    const diff = await runGit(tmpDir, ['diff' + fileArg], 10_000)
    return diff
  })
}

export async function readFileContent(workspaceId: string, filePath: string): Promise<string> {
  if (!shouldExclude(filePath) && supabase) {
    const result = await downloadFile(workspaceId, filePath)
    if (result.ok && result.content) {
      return result.content
    }
  }
  throw new Error(`File not found in Supabase: ${filePath}`)
}

export async function writeFileContent(workspaceId: string, filePath: string, content: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not connected - cannot persist files')
  }
  if (shouldExclude(filePath)) return

  const result = await uploadFile(workspaceId, filePath, content)
  if (!result.ok) {
    throw new Error(`Failed to write file to Supabase: ${result.error}`)
  }
}

export async function deleteFileEntry(workspaceId: string, filePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not connected - cannot delete files')
  }

  const result = await deleteFile(workspaceId, filePath)
  if (!result.ok && result.error !== 'Supabase not connected') {
    console.warn(`Failed to delete from Supabase: ${result.error}`)
  }
}

export async function listFiles(workspaceId: string): Promise<{ path: string; type: 'file' | 'directory'; size: number }[]> {
  if (!supabase) return []

  const allFiles = await listWorkspaceFiles(workspaceId)
  const result: { path: string; type: 'file' | 'directory'; size: number }[] = []
  const dirSet = new Set<string>()

  for (const f of allFiles) {
    const parts = f.path.split('/')
    for (let i = 1; i < parts.length; i++) {
      dirSet.add('/' + parts.slice(0, i).join('/'))
    }
    result.push({ path: '/' + f.path, type: 'file', size: 0 })
  }

  for (const dir of dirSet) {
    result.push({ path: dir, type: 'directory', size: 0 })
  }

  result.sort((a, b) => a.path.localeCompare(b.path))
  return result
}
