"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { MirrorfulLogo } from "@/components/brand/mirrorful-logo";
import { NAV_ITEMS, SETTINGS_ITEM, isNavActive, type NavItem } from "@/components/app/nav-items";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    onNavigate?.();
    await signOut();
    router.replace("/");
  }

  return (
    <div className="flex h-full flex-col bg-zinc-50">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MirrorfulLogo size="sm" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isNavActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-1 border-t border-border/70 px-3 py-4">
        <SidebarLink
          item={SETTINGS_ITEM}
          active={isNavActive(pathname, SETTINGS_ITEM.href)}
          onNavigate={onNavigate}
        />
        {user?.email ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-600">
              {user.email.slice(0, 2).toUpperCase()}
            </div>
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-zinc-200/70 hover:text-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-zinc-200/70 hover:text-foreground"
          >
            <LogOut className="size-[18px] text-zinc-400" />
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-zinc-200/70 text-zinc-900"
          : "text-muted-foreground hover:bg-zinc-200/50 hover:text-zinc-800",
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active ? "text-zinc-700" : "text-zinc-400")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
