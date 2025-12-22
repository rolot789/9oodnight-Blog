"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fafbfc]">
      <Card className="w-full max-w-md border border-[#e5e5e5] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-light tracking-wide text-[#080f18]">
            Admin Login
          </CardTitle>
          <CardDescription className="text-xs tracking-wider text-[#8b8c89]">
            Enter your credentials to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs tracking-wider text-[#8b8c89]">
                EMAIL
              </Label>
              <Input
                id="email"
                placeholder="admin@example.com"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border border-[#e5e5e5] text-sm placeholder-[#c0c0c0]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs tracking-wider text-[#8b8c89]">
                PASSWORD
              </Label>
              <Input
                id="password"
                required
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border border-[#e5e5e5] text-sm placeholder-[#c0c0c0]"
              />
            </div>
            <Button
              className="w-full bg-[#080f18] tracking-wider hover:bg-[#1a2632]"
              onClick={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
