import { CircleCheck, CirclePause, FolderKanban, Loader, TriangleAlert } from "lucide-react";
import { getOverviewStats } from "@/lib/dashboard";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const CARD_META: Record<string, { icon: typeof FolderKanban; iconClass: string }> = {
  total: { icon: FolderKanban, iconClass: "bg-zinc-100 text-zinc-600" },
  "In Progress": { icon: Loader, iconClass: "bg-sky-50 text-sky-600" },
  Delay: { icon: TriangleAlert, iconClass: "bg-red-50 text-red-600" },
  "On Hold": { icon: CirclePause, iconClass: "bg-orange-50 text-orange-600" },
  Delivered: { icon: CircleCheck, iconClass: "bg-emerald-50 text-emerald-600" },
};

export function OverviewCards({ projects }: { projects: Project[] }) {
  const stats = getOverviewStats(projects);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => {
        const meta = CARD_META[stat.key] ?? CARD_META.total;
        const Icon = meta.icon;
        return (
          <div
            key={stat.key}
            className="rounded-xl border border-border bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
              <span className={cn("flex size-7 items-center justify-center rounded-lg", meta.iconClass)}>
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
