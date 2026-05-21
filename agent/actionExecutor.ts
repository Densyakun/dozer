import { supabase } from '../lib/supabaseClient'
import { useFileSystemStore } from '../lib/store/fileSystem'
import { broadcastFileChange } from '../supabase/realtime'

export type Action =
  | { type: 'writeFile'; path: string; content: string }
  | { type: 'runCommand'; command: string; args?: string[] }
  | { type: 'deleteFile'; path: string }

export type ActionResult = {
  ok: boolean
  message?: string
  applied?: boolean
  error?: string
}

export async function executeAction(action: Action): Promise<ActionResult> {
  switch (action.type) {
    case 'writeFile':
      try {
        const store = useFileSystemStore.getState()
        
        store.updateFile(action.path, action.content)
        
        if (supabase) {
          await broadcastFileChange({
            path: action.path,
            content: action.content,
            type: 'file',
          })
        }
        
        console.log('writeFile applied:', action.path)
        return { ok: true, applied: true, message: `Written: ${action.path}` }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        return { ok: false, applied: false, error }
      }
      
    case 'deleteFile':
      try {
        const store = useFileSystemStore.getState()
        store.deleteFile(action.path)
        
        if (supabase) {
          await broadcastFileChange({
            path: action.path,
            content: '',
            type: 'file',
          })
        }
        
        return { ok: true, message: `Deleted: ${action.path}` }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
      
    case 'runCommand':
      console.log('runCommand requested:', action.command, action.args ?? [])
      return {
        ok: true,
        applied: false,
        message: `Command queued: ${action.command} ${(action.args ?? []).join(' ')}`,
      }
      
    default:
      return { ok: false, error: 'Unknown action type' }
  }
}

export async function executeActions(actions: Action[]): Promise<ActionResult[]> {
  const results: ActionResult[] = []
  
  for (const action of actions) {
    const result = await executeAction(action)
    results.push(result)
    
    if (!result.ok) {
      console.error('Action failed:', action, result.error)
    }
  }
  
  return results
}