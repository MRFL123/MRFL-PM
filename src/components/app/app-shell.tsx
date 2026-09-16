"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { MirrorfulLogo } from "@/components/brand/mirrorful-logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-border lg:flex lg:flex-col">
        <AppSidebar />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-[264px] max-w-[80%] flex-col border-r border-border bg-zinc-50 shadow-xl">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-zinc-200/70 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[250px]">
        <div className="flex h-14 items-center gap-3 border-b border-border bg-white px-4 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-zinc-100 hover:text-foreground"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/dashboard" className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <MirrorfulLogo size="sm" />
          </Link>
        </div>

        <main className="min-h-[calc(100vh-3.5rem)] lg:min-h-screen">{children}</main>
      </div>
    </div>
  );
}
