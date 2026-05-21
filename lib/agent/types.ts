export type WriteFileAction = {
  type: 'writeFile'
  path: string
  content: string
}

export type DeleteFileAction = {
  type: 'deleteFile'
  path: string
}

export type RunCommandAction = {
  type: 'runCommand'
  command: string
  args?: string[]
}

export type AgentAction = WriteFileAction | DeleteFileAction | RunCommandAction

export type AgentResult = {
  message: string
  actions: AgentAction[]
}

export type AgentStatus = {
  ok: boolean
  connected: boolean
  provider: 'portkey' | 'mock'
  model?: string
  configId?: string
  status: string
  hint?: string
}
