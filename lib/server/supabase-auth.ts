import type { User } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

function extractBearerToken(request?: NextRequest): string | null {
  if (!request) return null
  const header = request.headers.get("authorization") ?? ""
  const match = header.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]?.trim()
  return token || null
}

export async function getAuthenticatedUser(request?: NextRequest): Promise<User | null> {
  const supabase = await createClient()

  const userResult = await supabase.auth.getUser().catch(() => null)
  if (userResult?.data.user) {
    return userResult.data.user
  }

  const sessionResult = await supabase.auth.getSession().catch(() => null)
  if (sessionResult?.data.session?.user) {
    return sessionResult.data.session.user
  }

  const bearerToken = extractBearerToken(request)
  if (bearerToken) {
    const bearerUserResult = await supabase.auth.getUser(bearerToken).catch(() => null)
    if (bearerUserResult?.data.user) {
      return bearerUserResult.data.user
    }
  }

  return null
}
