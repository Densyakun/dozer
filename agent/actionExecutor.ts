import { supabase } from '../lib/supabaseClient'

export type Action =
  | { type: 'writeFile'; path: string; content: string }
  | { type: 'runCommand'; command: string }

export async function executeAction(action: Action) {
  switch (action.type) {
    case 'writeFile':
      console.log('writeFile', action.path)
      // For Phase1, call a local API to persist or apply patch in frontend.
      // We'll return the intended write result for the caller to handle.
      return { ok: true, applied: false }
    case 'runCommand':
      console.log('runCommand', action.command)
      return { ok: true, started: false }
    default:
      return { ok: false }
  }
}
