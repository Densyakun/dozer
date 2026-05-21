export type FileType = 'file' | 'directory'

export type FileMeta = {
  id?: string
  project_id?: string
  path: string
  type: FileType
  size?: number
  sha?: string
  updated_at?: string
}

export type Project = {
  id: string
  name: string
  repo_url?: string
  default_branch?: string
  description?: string
  owner_id?: string
  github_id?: string
  created_at?: string
  updated_at?: string
  is_active?: boolean
}

export type Workspace = {
  id: string
  project_id: string
  name: string
  opened_files: string[]
  active_tab?: string
  editor_state?: Record<string, unknown>
  preview_state?: Record<string, unknown>
  created_at?: string
  last_opened_at?: string
}

export type GitStatus = {
  current: string
  branch: string
  ahead: number
  behind: number
  files: GitFileStatus[]
}

export type GitFileStatus = {
  path: string
  index: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'unmodified'
  working_dir: 'modified' | 'added' | 'deleted' | 'untracked' | 'unmodified'
}

export type GitDiff = {
  file: string
  hunks: { oldStart: number; newStart: number; lines: { type: string; content: string }[] }[]
}

export type AIAction =
  | { type: 'writeFile'; path: string; content: string }
  | { type: 'deleteFile'; path: string }
  | { type: 'runCommand'; command: string; args?: string[] }

export type AIActionType = AIAction['type']

export type FileTreeNode = {
  path: string
  name: string
  type: FileType
  children: FileTreeNode[]
  expanded?: boolean
  size?: number
}

export type GitHubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  clone_url: string
  description: string | null
  private: boolean
  default_branch: string
  owner: { login: string; avatar_url: string }
}

export type GitHubUser = {
  login: string
  id: number
  avatar_url: string
  name: string | null
  email: string | null
}
