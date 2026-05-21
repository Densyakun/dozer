import { promises as fs } from 'fs'
import path from 'path'
import { supabase } from '../supabaseClient'
import {
  uploadFile, downloadFile, deleteFile, shouldExclude, getStoragePath,
} from '../supabase/storage'

const MIRROR_ROOT = process.env.GIT_MIRROR_ROOT || path.join(process.cwd(), '.git-mirror')

export function getRepoPath(projectId: string): string {
  return path.join(MIRROR_ROOT, projectId)
}

export async function ensureMirrorDir(): Promise<void> {
  await fs.mkdir(MIRROR_ROOT, { recursive: true })
}

export async function shallowClone(repoUrl: string, projectId: string): Promise<void> {
  const repoPath = getRepoPath(projectId)
  await ensureMirrorDir()

  const { execSync } = await import('child_process')
  execSync(`git clone --depth 1 "${repoUrl}" "${repoPath}"`, {
    stdio: 'pipe',
    timeout: 120_000,
  })
}

export async function getGitStatus(projectId: string) {
  const repoPath = getRepoPath(projectId)
  const gitDir = path.join(repoPath, '.git')

  try {
    await fs.stat(gitDir)
  } catch {
    return { current: '', branch: '', ahead: 0, behind: 0, files: [] }
  }

  const { execSync } = await import('child_process')

  try {
    const statusText = execSync(`git -C "${repoPath}" status --porcelain=v1`, {
      encoding: 'utf-8',
      timeout: 10_000,
    })

    const current = execSync(`git -C "${repoPath}" branch --show-current`, {
      encoding: 'utf-8',
      timeout: 5_000,
    }).trim()

    const aheadBehind = execSync(
      `git -C "${repoPath}" rev-list --left-right --count HEAD...@{upstream} 2>/dev/null || echo "0 0"`,
      { encoding: 'utf-8', timeout: 5_000 }
    ).trim()

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
  } catch (err) {
    return { current: '', branch: '', ahead: 0, behind: 0, files: [] }
  }
}

export async function gitCommit(projectId: string, message: string): Promise<void> {
  const repoPath = getRepoPath(projectId)
  const { execSync } = await import('child_process')

  execSync(`git -C "${repoPath}" add -A`, { stdio: 'pipe', timeout: 30_000 })
  execSync(`git -C "${repoPath}" commit -m "${message.replace(/"/g, '\\"')}"`, {
    stdio: 'pipe',
    timeout: 30_000,
  })
}

export async function gitPush(projectId: string): Promise<void> {
  const repoPath = getRepoPath(projectId)
  const { execSync } = await import('child_process')
  execSync(`git -C "${repoPath}" push`, { stdio: 'pipe', timeout: 60_000 })
}

export async function gitPull(projectId: string): Promise<void> {
  const repoPath = getRepoPath(projectId)
  const { execSync } = await import('child_process')
  execSync(`git -C "${repoPath}" pull --rebase`, { stdio: 'pipe', timeout: 60_000 })
}

export async function gitCheckout(projectId: string, branch: string): Promise<void> {
  const repoPath = getRepoPath(projectId)
  const { execSync } = await import('child_process')
  execSync(`git -C "${repoPath}" checkout "${branch}"`, { stdio: 'pipe', timeout: 30_000 })
}

export async function gitCreateBranch(projectId: string, name: string): Promise<void> {
  const repoPath = getRepoPath(projectId)
  const { execSync } = await import('child_process')
  execSync(`git -C "${repoPath}" checkout -b "${name}"`, { stdio: 'pipe', timeout: 30_000 })
}

export async function gitBranches(projectId: string): Promise<{ branches: string[]; current: string }> {
  const repoPath = getRepoPath(projectId)
  const { execSync } = await import('child_process')

  const current = execSync(`git -C "${repoPath}" branch --show-current`, {
    encoding: 'utf-8', timeout: 5_000,
  }).trim()

  const list = execSync(`git -C "${repoPath}" branch --format="%(refname:short)"`, {
    encoding: 'utf-8', timeout: 5_000,
  }).trim().split('\n').filter(Boolean)

  return { branches: list, current }
}

export async function gitDiff(projectId: string, filePath?: string): Promise<string> {
  const repoPath = getRepoPath(projectId)
  const { execSync } = await import('child_process')

  const fileArg = filePath ? ` -- "${filePath.replace(/"/g, '\\"')}"` : ''
  const diff = execSync(`git -C "${repoPath}" diff${fileArg}`, {
    encoding: 'utf-8', timeout: 10_000,
  })
  return diff
}

export async function readFileContent(projectId: string, filePath: string): Promise<string> {
  if (!shouldExclude(filePath) && supabase) {
    const result = await downloadFile(projectId, filePath)
    if (result.ok && result.content) {
      return result.content
    }
  }

  const repoPath = getRepoPath(projectId)
  const fullPath = path.join(repoPath, filePath)
  return await fs.readFile(fullPath, 'utf-8')
}

export async function writeFileContent(projectId: string, filePath: string, content: string): Promise<void> {
  const repoPath = getRepoPath(projectId)
  const fullPath = path.join(repoPath, filePath)
  await fs.mkdir(path.dirname(fullPath), { recursive: true })
  await fs.writeFile(fullPath, content, 'utf-8')

  if (!shouldExclude(filePath) && supabase) {
    const result = await uploadFile(projectId, filePath, content)
    if (!result.ok && result.error !== 'Supabase not connected') {
      console.warn(`Failed to sync to Supabase: ${result.error}`)
    }
  }
}

export async function deleteFileEntry(projectId: string, filePath: string): Promise<void> {
  const repoPath = getRepoPath(projectId)
  const fullPath = path.join(repoPath, filePath)
  await fs.rm(fullPath, { recursive: true, force: true })

  if (!shouldExclude(filePath) && supabase) {
    await deleteFile(projectId, filePath)
  }
}

export async function listFiles(projectId: string): Promise<{ path: string; type: 'file' | 'directory'; size: number }[]> {
  const repoPath = getRepoPath(projectId)
  const result: { path: string; type: 'file' | 'directory'; size: number }[] = []

  async function walk(dir: string, relativePath: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relativePath, entry.name).replace(/\\/g, '/')
      if (entry.isDirectory()) {
        result.push({ path: '/' + relPath, type: 'directory', size: 0 })
        await walk(fullPath, relPath)
      } else if (entry.isFile()) {
        const stat = await fs.stat(fullPath)
        result.push({ path: '/' + relPath, type: 'file', size: stat.size })
      }
    }
  }

  await walk(repoPath, '')
  return result
}
