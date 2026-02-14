import { createBrowserClient } from "@supabase/ssr"
import { fetchWithTimeout } from "@/lib/supabase/fetch-with-timeout"

let supabase: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  if (!supabase) {
    supabase = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          fetch: fetchWithTimeout,
        },
      }
    )
  }
  return supabase
}
