import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import LogoutButton from "@/components/LogoutButton"

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <header className="w-full border-b border-[#e5e5e5] bg-white sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-light tracking-[0.3em] text-[#080f18]">
          MY PORTFOLIO
        </Link>
        <nav className="flex items-center gap-8">
          <Link href="/" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
            HOME
          </Link>
          <Link href="/dev" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
            DEV
          </Link>
          <Link href="/math" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
            MATH
          </Link>
          <Link href="/about" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
            ABOUT
          </Link>
          {session ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]">
              LOGIN
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
