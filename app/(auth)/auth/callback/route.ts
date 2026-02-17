import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { getSafeRedirectPath } from "@/lib/shared/security";

type RawCookieOptions = {
  domain?: unknown
  expires?: unknown
  httpOnly?: unknown
  maxAge?: unknown
  partitioned?: unknown
  path?: unknown
  priority?: unknown
  sameSite?: unknown
  secure?: unknown
}

function normalizeCookieOptions(options: RawCookieOptions = {}): Partial<ResponseCookie> {
  const isProduction = process.env.NODE_ENV === "production"
  const normalized: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
  }

  if (typeof options.domain === "string") {
    normalized.domain = options.domain
  }

  if (typeof options.path === "string") {
    normalized.path = options.path
  }

  if (typeof options.maxAge === "number") {
    normalized.maxAge = options.maxAge
  }

  if (options.expires instanceof Date) {
    normalized.expires = options.expires
  }

  if (typeof options.httpOnly === "boolean") {
    normalized.httpOnly = options.httpOnly
  }

  if (typeof options.secure === "boolean") {
    normalized.secure = options.secure
  }

  if (typeof options.partitioned === "boolean") {
    normalized.partitioned = options.partitioned
  }

  if (options.priority === "low" || options.priority === "medium" || options.priority === "high") {
    normalized.priority = options.priority
  }

  if (options.sameSite === true || options.sameSite === false || options.sameSite === "lax" || options.sameSite === "strict" || options.sameSite === "none") {
    normalized.sameSite = options.sameSite
  }

  return normalized
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []; // Cookies handled by response
          },
          setAll(cookiesToSet) {
            // This is a temporary instance just to exchange code
          },
        },
      }
    );

    // Create a response object to handle cookie setting
    const response = NextResponse.redirect(`${origin}${next}`);
    
    // Re-create client with response-aware cookie handling
    const supabaseWithCookies = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, normalizeCookieOptions(options ?? {}));
              });
            },
          },
        }
      );

    const { error } = await supabaseWithCookies.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
