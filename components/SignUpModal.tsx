"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";
import { Github } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SignUpModal({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setMessage("Check your email for the confirmation link.");
      }
    } catch (err) {
      console.error("Error during sign up:", err);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#fafbfc] border-[#e5e5e5]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-light tracking-wide text-[#080f18]">Create Account</DialogTitle>
          <DialogDescription className="text-center text-xs tracking-wider text-[#8b8c89]">
            Sign up to start writing
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {error && (
            <div className="border-l-2 border-red-400 bg-red-50 py-3 pl-4 text-xs tracking-wider text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="border-l-2 border-green-400 bg-green-50 py-3 pl-4 text-xs tracking-wider text-green-700">
              {message}
            </div>
          )}

          <div className="space-y-2">
            <label 
              htmlFor="signup-email" 
              className="block text-xs font-bold tracking-widest text-[#080f18]"
            >
              EMAIL
            </label>
            <input
              id="signup-email"
              placeholder="user@example.com"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-[#e5e5e5] bg-transparent py-3 pl-2 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#080f18]"
            />
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="signup-password" 
              className="block text-xs font-bold tracking-widest text-[#080f18]"
            >
              PASSWORD
            </label>
            <input
              id="signup-password"
              required
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-[#e5e5e5] bg-transparent py-3 pl-2 text-sm text-[#080f18] placeholder-[#c0c0c0] outline-none transition-colors focus:border-[#080f18]"
            />
          </div>

          <button
            className="mt-8 w-full border border-[#080f18] bg-[#080f18] py-3 text-xs font-medium tracking-widest text-white transition-all hover:bg-transparent hover:text-[#080f18] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? "PROCESSING..." : "SIGN UP"}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}