import type { User } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUser } from "@/lib/server/supabase-auth"

export interface AuthContext {
  user: User
  role?: string | null
}

export async function requireAuthUser(request?: NextRequest): Promise<User | null> {
  return getAuthenticatedUser(request)
}

export async function requireAuthUserWithRole(
  request: NextRequest,
  allowedRoles: string[] = []
): Promise<AuthContext | null> {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return null
  }

  if (allowedRoles.length === 0) {
    return { user }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = (data as { role?: string | null } | null)?.role ?? null
  if (role && !allowedRoles.includes(role)) {
    return null
  }

  if (!role && allowedRoles.length > 0) {
    return null
  }

  return { user, role }
}
