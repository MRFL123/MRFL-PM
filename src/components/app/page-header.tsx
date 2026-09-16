"use client";

import type { ReactNode } from "react";
import { useProjects } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  const { saveState } = useProjects();

  return (
    <div className={cn("border-b border-border bg-white", className)}>
      <div className="mx-auto flex w-full max-w-[88rem] flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {saveState === "saving" ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">Saving…</span>
          ) : saveState === "saved" ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">Saved</span>
          ) : null}
          {actions}
        </div>
      </div>
    </div>
  );
}
