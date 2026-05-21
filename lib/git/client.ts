import type { GitStatus, GitDiff } from '../../types'

export async function fetchGitStatus(projectId: string): Promise<GitStatus> {
  const res = await fetch(`/api/git/status?projectId=${projectId}`)
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.status
}

export async function fetchGitDiff(projectId: string, filePath?: string): Promise<GitDiff> {
  const params = new URLSearchParams({ projectId })
  if (filePath) params.set('file', filePath)
  const res = await fetch(`/api/git/diff?${params}`)
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.diff
}

export async function gitCommit(projectId: string, message: string): Promise<void> {
  const res = await fetch('/api/git/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, message }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function gitPush(projectId: string): Promise<void> {
  const res = await fetch('/api/git/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function gitPull(projectId: string): Promise<void> {
  const res = await fetch('/api/git/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })
  if (!res.ok) throw new Error(await res.text())
}
