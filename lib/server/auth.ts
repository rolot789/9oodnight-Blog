import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiSuccess } from "@/lib/shared/api-response"

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"))
    .forEach((cookie) => {
      response.cookies.delete(cookie.name)
    })
}

export async function signOutWithJson(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.json(apiSuccess({ signedOut: true }))
  clearSupabaseCookies(request, response)
  return response
}

export async function signOutWithRedirect(
  request: NextRequest,
  redirectTo = "/"
): Promise<NextResponse> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL(redirectTo, request.url), { status: 302 })
  clearSupabaseCookies(request, response)
  return response
}
