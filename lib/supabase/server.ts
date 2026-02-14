import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { fetchWithTimeout } from "@/lib/supabase/fetch-with-timeout"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: fetchWithTimeout,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
        }
      },
    },
  })
}
