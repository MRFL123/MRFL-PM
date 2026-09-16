"use client";

import { AppShell } from "@/components/app/app-shell";
import { RequireAuth } from "@/components/auth/require-auth";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
