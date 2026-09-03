"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { ready, signedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !signedIn) {
      router.replace("/");
    }
  }, [ready, signedIn, router]);

  if (!ready || !signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8] text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
