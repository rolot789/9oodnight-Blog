"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { SignUpModal } from "@/components/SignUpModal";

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

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || "Invalid credentials");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Error during auth:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "github" | "google") => {
    setIsLoading(true);
    setError("");
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      console.error("OAuth error:", err);
      setError("An error occurred with OAuth.");
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
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
          {/* Auth Form Container */}
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-10 text-center">
              <h1 className="mb-3 text-2xl font-light tracking-wide text-[#080f18]">
                Welcome Back
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
                  placeholder="user@example.com"
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
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? "PROCESSING..." : "LOGIN"}
              </button>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-[#e5e5e5]"></div>
                <span className="flex-shrink-0 px-4 text-[10px] tracking-widest text-[#8b8c89]">OR CONTINUE WITH</span>
                <div className="flex-grow border-t border-[#e5e5e5]"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleOAuth("github")}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 border border-[#e5e5e5] bg-white py-3 text-xs tracking-wider text-[#080f18] transition-colors hover:border-[#080f18]"
                >
                  <Github className="h-4 w-4" />
                  GITHUB
                </button>
                <button
                  onClick={() => handleOAuth("google")}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 border border-[#e5e5e5] bg-white py-3 text-xs tracking-wider text-[#080f18] transition-colors hover:border-[#080f18]"
                >
                   <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  GOOGLE
                </button>
              </div>

              <div className="mt-6 text-center">
                 <SignUpModal>
                    <button
                      className="text-xs tracking-wider text-[#8b8c89] transition-colors hover:text-[#080f18] hover:underline"
                    >
                      DON'T HAVE AN ACCOUNT? SIGN UP
                    </button>
                 </SignUpModal>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}