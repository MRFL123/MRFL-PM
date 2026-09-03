"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { MirrorfulLogo } from "@/components/brand/mirrorful-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useProjects } from "@/lib/store";

type AppHeaderProps = {
  actions?: React.ReactNode;
};

export function AppHeader({ actions }: AppHeaderProps) {
  const { signOut } = useAuth();
  const { saveState } = useProjects();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <header className="border-b border-border/70 bg-white">
      <div className="mx-auto flex max-w-[88rem] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/projects" className="min-w-0 shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <MirrorfulLogo size="sm" />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          {saveState === "saving" ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">Saving...</span>
          ) : saveState === "saved" ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">Saved</span>
          ) : null}
          {actions}
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="shrink-0 text-muted-foreground">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
