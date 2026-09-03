"use client";

import { AppHeader } from "@/components/brand/app-header";
import { RequireAuth } from "@/components/auth/require-auth";

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#f5f6f8]">
        <AppHeader />
        {children}
      </div>
    </RequireAuth>
  );
}
