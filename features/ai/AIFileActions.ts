'use client'

import { useFileSystemStore } from '../../lib/store/fileSystem'
import { mountFiles, writeFileToContainer } from '../../webcontainer/mountManager'
import { lazyLoadFile, updateCache } from '../../lib/filesystem/lazyLoader'

export type AIFileAction =
  | { type: 'writeFile'; path: string; content: string }
  | { type: 'deleteFile'; path: string }
  | { type: 'runCommand'; command: string; args?: string[] }

export type ActionResult = {
  ok: boolean
  message: string
  error?: string
}

export async function executeAIAction(
  action: AIFileAction,
  workspaceId: string
): Promise<ActionResult> {
  switch (action.type) {
    case 'writeFile': {
      try {
        const store = useFileSystemStore.getState()
        store.updateFileContent(action.path, action.content)
        store.openFile(action.path)

        updateCache(action.path, action.content)

        await writeFileToContainer(action.path, action.content)

        return { ok: true, message: `Written: ${action.path}` }
      } catch (err) {
        return { ok: false, message: `Failed: ${action.path}`, error: String(err) }
      }
    }

    case 'deleteFile': {
      try {
        const store = useFileSystemStore.getState()
        store.closeFile(action.path)

        const ws = useFileSystemStore.getState()
        await ws.deleteEntity(workspaceId, action.path)

        return { ok: true, message: `Deleted: ${action.path}` }
      } catch (err) {
        return { ok: false, message: `Failed: ${action.path}`, error: String(err) }
      }
    }

    case 'runCommand': {
      try {
        const { runInContainer } = await import('../../webcontainer/mountManager')
        const exitCode = await runInContainer(action.command, action.args)
        return {
          ok: exitCode !== null,
          message: exitCode === 0
            ? `Command completed: ${action.command}`
            : `Command failed (exit ${exitCode}): ${action.command}`,
        }
      } catch (err) {
        return { ok: false, message: `Command error: ${action.command}`, error: String(err) }
      }
    }

    default:
      return { ok: false, message: `Unknown action type` }
  }
}

export async function executeAIActions(
  actions: AIFileAction[],
  workspaceId: string
): Promise<ActionResult[]> {
  const results: ActionResult[] = []
  for (const action of actions) {
    const result = await executeAIAction(action, workspaceId)
    results.push(result)
  }
  return results
}
