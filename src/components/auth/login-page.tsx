"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MirrorfulLogo } from "@/components/brand/mirrorful-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";

export function LoginPage() {
  const { ready, signedIn, configured, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && signedIn) {
      router.replace("/dashboard");
    }
  }, [ready, signedIn, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const ok = await signIn(email, password);
      if (ok) {
        router.replace("/dashboard");
        return;
      }
      setError("Invalid email or password.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050607] text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050607] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_68%)]"
      />
      <div className="relative w-full max-w-[26rem]">
        <div className="mb-10 flex justify-center">
          <MirrorfulLogo variant="dark" size="lg" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-white">Sign in</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Enter your Mirrorful workspace email and password to open the project dashboard.
            </p>
          </div>

          {!configured ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="alert">
              Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the app.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-10 border-white/15 bg-zinc-900 text-white placeholder:text-zinc-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/30"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-10 border-white/15 bg-zinc-900 text-white placeholder:text-zinc-500 focus-visible:border-cyan-400 focus-visible:ring-cyan-400/30"
                />
              </div>

              {error ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={submitting || !email.trim() || !password}
                className="h-10 w-full border-0 bg-gradient-to-r from-cyan-400 to-teal-400 text-zinc-950 hover:from-cyan-300 hover:to-teal-300"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
