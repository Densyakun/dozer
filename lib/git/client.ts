import type { GitStatus, GitDiff } from '../../types'

export async function fetchGitStatus(workspaceId: string): Promise<GitStatus> {
  const res = await fetch(`/api/git/status?workspaceId=${workspaceId}`)
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.status
}

export async function fetchGitDiff(workspaceId: string, filePath?: string): Promise<GitDiff> {
  const params = new URLSearchParams({ workspaceId })
  if (filePath) params.set('file', filePath)
  const res = await fetch(`/api/git/diff?${params}`)
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.diff
}

export async function gitCommit(workspaceId: string, message: string): Promise<void> {
  const res = await fetch('/api/git/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, message }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function gitPush(workspaceId: string): Promise<void> {
  const res = await fetch('/api/git/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId }),
  })
  if (!res.ok) throw new Error(await res.text())
}

export async function gitPull(workspaceId: string): Promise<void> {
  const res = await fetch('/api/git/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId }),
  })
  if (!res.ok) throw new Error(await res.text())
}
