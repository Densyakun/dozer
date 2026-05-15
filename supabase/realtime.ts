import { supabase } from '../lib/supabaseClient'

/** Stub channel: enable Realtime on your Supabase project and wire a table channel here. */
export function subscribeFiles(_callback: (payload: unknown) => void) {
  if (!supabase) {
    return { unsubscribe: () => {} }
  }
  const channel = supabase.channel('files')
  return {
    unsubscribe: () => {
      void channel.unsubscribe()
    },
  }
}
