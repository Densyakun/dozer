import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { supabase } from '../supabaseClient'
import {
  uploadFile, downloadFile, downloadBinary, deleteFile, uploadBinary,
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
  console.log(`[Git Download] Starting download for workspace ${workspaceId}`)
  const allFiles = await listAllFiles(workspaceId)
  console.log(`[Git Download] Found ${allFiles.length} files in Supabase`)

  let downloadedCount = 0
  let gitFilesCount = 0

  for (const file of allFiles) {
    const fullPath = path.join(tmpDir, file.path)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })

    if (file.path.startsWith('.git/') || file.path === '.git' || file.path.includes('/.git/')) {
      gitFilesCount++
      console.log(`[Git Download] Downloading git file: ${file.path}`)
      const result = await downloadBinary(workspaceId, file.path)
      if (result.ok && result.buffer) {
        await fs.writeFile(fullPath, result.buffer)
        downloadedCount++
      } else {
        console.error(`[Git Download] Failed to download git file ${file.path}:`, result.error)
      }
    } else {
      const result = await downloadFile(workspaceId, file.path)
      if (result.ok && result.content !== undefined) {
        await fs.writeFile(fullPath, result.content, 'utf-8')
        downloadedCount++
      } else {
        console.error(`[Git Download] Failed to download file ${file.path}:`, result.error)
      }
    }
  }

  console.log(`[Git Download] Completed: ${downloadedCount}/${allFiles.length} files downloaded, ${gitFilesCount} git files`)

  // Verify .git folder structure
  const gitConfigExists = await fileExistsLocal(tmpDir, '.git/config')
  const gitHeadExists = await fileExistsLocal(tmpDir, '.git/HEAD')
  console.log(`[Git Download] Verification - .git/config exists: ${gitConfigExists}, .git/HEAD exists: ${gitHeadExists}`)
}

async function uploadAllFromTemp(workspaceId: string, tmpDir: string): Promise<void> {
  let uploadedCount = 0
  let skippedCount = 0

  async function walk(dir: string, relativePath: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name === 'node_modules') continue
      const fullPath = path.join(dir, entry.name)
      const relPath = path.join(relativePath, entry.name).replace(/\\/g, '/')
      if (entry.isDirectory()) {
        // Upload .git directory files as binary
        if (entry.name === '.git') {
          await walk(fullPath, relPath)
        } else {
          await walk(fullPath, relPath)
        }
      } else {
        const isGitFile = relPath.startsWith('.git/') || relPath === '.git' || relPath.includes('/.git/')
        // Exclude node_modules but include .git files
        if (shouldExclude(relPath) && !isGitFile) {
          skippedCount++
          continue
        }

        if (isGitFile) {
          // Upload .git files as binary
          const buffer = await fs.readFile(fullPath)
          const result = await uploadBinary(workspaceId, relPath, buffer)
          if (result.ok) {
            uploadedCount++
          } else {
            console.error(`[Git Upload] Failed to upload git file ${relPath}:`, result.error)
          }
        } else {
          // Upload regular files as text
          const content = await fs.readFile(fullPath, 'utf-8')
          const result = await uploadFile(workspaceId, relPath, content, true)
          if (result.ok) {
            uploadedCount++
          } else {
            console.error(`[Git Upload] Failed to upload ${relPath}:`, result.error)
          }
        }
      }
    }
  }

  console.log('[Git Upload] Starting file upload...')
  await walk(tmpDir, '')
  console.log(`[Git Upload] Completed: ${uploadedCount} files uploaded, ${skippedCount} files skipped`)
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
  if (!supabase) {
    throw new Error('Supabase not connected - cannot clone repository')
  }

  console.log(`[Git Clone] Starting clone for workspace ${workspaceId} from ${repoUrl}`)

  await withTempDir(async (tmpDir) => {
    try {
      console.log(`[Git Clone] Cloning repository to ${tmpDir}`)
      await runGit(tmpDir, ['clone', '--depth', '1', `"${repoUrl}"`, `"${tmpDir}"`], 120_000)
      console.log('[Git Clone] Clone completed successfully')

      const { execSync } = await import('child_process')
      try {
        console.log('[Git Clone] Initializing sparse-checkout')
        execSync(`git -C "${tmpDir}" sparse-checkout init --cone`, {
          stdio: 'pipe', timeout: 10_000,
        })
      } catch {
        // sparse-checkout is optional, ignore errors
        console.log('[Git Clone] Sparse-checkout initialization skipped (optional)')
      }

      // Get the actual current branch and update workspace
      let actualBranch = 'main'
      try {
        actualBranch = (await runGit(tmpDir, ['branch', '--show-current'], 5_000)).trim()
        console.log(`[Git Clone] Actual branch: ${actualBranch}`)
        
        // Update workspace default_branch in Supabase
        if (supabase) {
          const { error } = await supabase
            .from('workspaces')
            .update({ default_branch: actualBranch })
            .eq('id', workspaceId)
          if (error) {
            console.error('[Git Clone] Failed to update default_branch:', error)
          } else {
            console.log('[Git Clone] Updated default_branch in workspace')
          }
        }
      } catch (branchErr) {
        console.error('[Git Clone] Failed to get current branch:', branchErr)
      }

      // Check git status before uploading to verify repository is valid
      try {
        const statusText = await runGit(tmpDir, ['status', '--porcelain=v1'], 10_000)
        console.log(`[Git Clone] Git status check: changed files=${statusText.split('\n').filter(Boolean).length}`)
      } catch (statusErr) {
        console.error('[Git Clone] Git status check failed:', statusErr)
      }

      console.log('[Git Clone] Uploading files to Supabase Storage')
      await uploadAllFromTemp(workspaceId, tmpDir)
      console.log('[Git Clone] Upload completed successfully')
    } catch (err) {
      console.error('[Git Clone] Error:', err)
      throw new Error(`Failed to clone repository: ${String(err)}`)
    }
  })
}

export async function getGitStatus(workspaceId: string, repoUrl?: string, defaultBranch?: string): Promise<{ current: string; branch: string; ahead: number; behind: number; files: any[] }> {
  console.log(`[Git Status] Getting status for workspace ${workspaceId}`)

  return withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)

    const hasGit = await fileExistsLocal(tmpDir, '.git')
    console.log(`[Git Status] .git folder exists: ${hasGit}`)

    if (!hasGit) {
      console.log('[Git Status] No .git folder, initializing git repository')
      try {
        await runGit(tmpDir, ['init'], 10_000)
        await runGit(tmpDir, ['config', 'user.email', 'dozer@local'], 5_000)
        await runGit(tmpDir, ['config', 'user.name', 'Dozer'], 5_000)
        const branch = defaultBranch || 'main'
        await runGit(tmpDir, ['checkout', '-b', branch], 5_000)
        await runGit(tmpDir, ['add', '-A'], 30_000)
        await runGit(tmpDir, ['commit', '-m', '"Initial commit"'], 30_000)
        console.log('[Git Status] Git repository initialized')
        await uploadAllFromTemp(workspaceId, tmpDir)
      } catch (initErr) {
        console.error('[Git Status] Failed to initialize git:', initErr)
        return { current: '', branch: '', ahead: 0, behind: 0, files: [] }
      }
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

      const status = { current, branch: current, ahead, behind, files }
      console.log(`[Git Status] Returning status: branch=${current}, files=${files.length}`)
      return status
    } catch (err) {
      console.error('[Git Status] Error:', err)
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

export async function gitBranches(workspaceId: string, repoUrl?: string, defaultBranch?: string): Promise<{ branches: string[]; current: string }> {
  console.log(`[Git Branches] Getting branches for workspace ${workspaceId}`)

  return withTempDir(async (tmpDir) => {
    await downloadAllToTemp(workspaceId, tmpDir)

    const hasGit = await fileExistsLocal(tmpDir, '.git')
    console.log(`[Git Branches] .git folder exists: ${hasGit}`)

    if (!hasGit) {
      console.log('[Git Branches] No .git folder, initializing git repository')
      try {
        await runGit(tmpDir, ['init'], 10_000)
        await runGit(tmpDir, ['config', 'user.email', 'dozer@local'], 5_000)
        await runGit(tmpDir, ['config', 'user.name', 'Dozer'], 5_000)
        const branch = defaultBranch || 'main'
        await runGit(tmpDir, ['checkout', '-b', branch], 5_000)
        await runGit(tmpDir, ['add', '-A'], 30_000)
        await runGit(tmpDir, ['commit', '-m', '"Initial commit"'], 30_000)
        console.log('[Git Branches] Git repository initialized')
        await uploadAllFromTemp(workspaceId, tmpDir)
      } catch (initErr) {
        console.error('[Git Branches] Failed to initialize git:', initErr)
        return { branches: [], current: '' }
      }
    }

    try {
      const current = (await runGit(tmpDir, ['branch', '--show-current'], 5_000)).trim()
      const list = (await runGit(tmpDir, ['branch', '--format="%(refname:short)"'], 5_000))
        .trim().split('\n').filter(Boolean)

      console.log(`[Git Branches] Current branch: ${current}, Total branches: ${list.length}`)
      return { branches: list, current }
    } catch (err) {
      console.error('[Git Branches] Error:', err)
      return { branches: [], current: '' }
    }
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
  if (shouldExclude(filePath)) {
    console.log(`[writeFileContent] Skipping excluded file: ${filePath}`)
    return
  }

  console.log(`[writeFileContent] Writing file to Supabase: ${filePath} (${content.length} chars)`)
  const result = await uploadFile(workspaceId, filePath, content)
  if (!result.ok) {
    console.error(`[writeFileContent] Failed to write file: ${result.error}`)
    throw new Error(`Failed to write file to Supabase: ${result.error}`)
  }
  console.log(`[writeFileContent] Successfully wrote file: ${filePath}`)
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
