"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // 성공 - 리다이렉트
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Error signing in:", err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignIn();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Back Link - Left aligned */}
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="flex flex-col items-center justify-center">
          {/* Login Form Container */}
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-10 text-center">
              <h1 className="mb-3 text-2xl font-light tracking-wide text-[#080f18]">
                Admin Login
              </h1>
              <p className="text-xs tracking-wider text-[#8b8c89]">
                Enter your credentials to continue
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {error && (
                <div className="border-l-2 border-red-400 bg-red-50 py-3 pl-4 text-xs tracking-wider text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-xs font-bold tracking-widest text-[#080f18]"
                >
                  EMAIL
                </label>
                <input
                  id="email"
                  placeholder="admin@example.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full border-b border-[#e5e5e5] bg-transparent py-3 pl-2 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#080f18]"
                />
              </div>

              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className="block text-xs font-bold tracking-widest text-[#080f18]"
                >
                  PASSWORD
                </label>
                <input
                  id="password"
                  required
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full border-b border-[#e5e5e5] bg-transparent py-3 pl-2 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#080f18]"
                />
              </div>

              <button
                className="mt-8 w-full border border-[#080f18] bg-[#080f18] py-3 text-xs font-medium tracking-widest text-white transition-all hover:bg-transparent hover:text-[#080f18] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
