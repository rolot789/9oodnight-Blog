import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/shared/security";

function normalizeCookieOptions(options: Record<string, unknown>) {
  const isProduction = process.env.NODE_ENV === "production"
  return {
    ...options,
    httpOnly: options?.httpOnly ?? true,
    secure: options?.secure ?? isProduction,
    sameSite: options?.sameSite ?? "lax",
  }
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
