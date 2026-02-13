"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import type { ApiResponse } from "@/lib/shared/api-response"

export default function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" })
      const payload = (await res.json()) as ApiResponse<{ signedOut: boolean }>
      if (!payload.ok) {
        throw new Error(payload.error.message)
      }
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18] disabled:opacity-50"
    >
      {isLoading ? "LOGGING OUT..." : "LOGOUT"}
    </button>
  )
}
