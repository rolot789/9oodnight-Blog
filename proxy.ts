import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { buildContentSecurityPolicy } from "@/lib/shared/csp"

const protectedRoutes = ["/edit", "/admin"]

function getRequestIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || ""
  }
  return request.headers.get("x-real-ip") || request.ip || ""
}

function isAllowedCorsOrigin(origin: string | null): string | null {
  if (!origin) {
    return null
  }

  const allowList = (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",").map((item) => item.trim())
  if (allowList.length > 0 && allowList.includes(origin)) {
    return origin
  }

  if (process.env.NODE_ENV === "development") {
    return origin
  }

  return null
}

function shouldUseSecureCookies(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false
  }

  const host = request.nextUrl.hostname
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const proto = request.nextUrl.protocol
  return (forwardedProto === "https" || proto === "https:") && host !== "localhost" && host !== "127.0.0.1"
}

export async function proxy(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID()
  const nonce = crypto.randomUUID().replace(/-/g, "")
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-request-id", requestId)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("x-real-ip", getRequestIp(request) || "unknown")

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          const secureCookies = shouldUseSecureCookies(request)
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: options?.httpOnly ?? true,
              secure: options?.secure ?? secureCookies,
              sameSite: options?.sameSite ?? "lax",
            })
          })
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !data?.claims?.sub) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  supabaseResponse.headers.set(
    "Content-Security-Policy",
    buildContentSecurityPolicy(nonce)
  )
  supabaseResponse.headers.set("x-request-id", requestId)
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff")
  supabaseResponse.headers.set("X-Frame-Options", "DENY")
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  supabaseResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  supabaseResponse.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  )
  supabaseResponse.headers.set("Cross-Origin-Resource-Policy", "same-origin")
  supabaseResponse.headers.set("X-DNS-Prefetch-Control", "off")

  if (request.method === "OPTIONS") {
    const allowedOrigin = isAllowedCorsOrigin(request.headers.get("origin"))
    if (allowedOrigin) {
      supabaseResponse.headers.set("Access-Control-Allow-Origin", allowedOrigin)
      supabaseResponse.headers.set("Vary", "Origin")
      supabaseResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
      supabaseResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, x-request-id, Authorization")
      supabaseResponse.headers.set("Access-Control-Allow-Credentials", "true")
      supabaseResponse.headers.set("Access-Control-Max-Age", "600")
    }
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return supabaseResponse
    }
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    const allowedOrigin = isAllowedCorsOrigin(request.headers.get("origin"))
    if (allowedOrigin) {
      supabaseResponse.headers.set("Access-Control-Allow-Origin", allowedOrigin)
      supabaseResponse.headers.set("Vary", "Origin")
      supabaseResponse.headers.set("Access-Control-Allow-Credentials", "true")
    }
    supabaseResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE")
    supabaseResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, x-request-id, Authorization")
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
