export type WriteFileAction = {
  type: 'writeFile'
  path: string
  content: string
}

export type RunCommandAction = {
  type: 'runCommand'
  command: string
}

export type AgentAction = WriteFileAction | RunCommandAction

export type AgentResult = {
  message: string
  actions: AgentAction[]
}

export type AgentStatus = {
  ok: boolean
  connected: boolean
  provider: 'portkey' | 'mock'
  model?: string
  status: string
  hint?: string
}
