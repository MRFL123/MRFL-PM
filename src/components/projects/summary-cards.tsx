import { STATUS_DOT } from "@/lib/status";
import { countByStatus, countByType } from "@/lib/projects";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CARDS = [
  { key: "total", label: "Total Projects", color: "bg-zinc-400" },
  { key: "In Progress", label: "In Progress", color: STATUS_DOT["In Progress"] },
  { key: "Delivered", label: "Delivered", color: STATUS_DOT.Delivered },
  { key: "Delay", label: "Delayed", color: STATUS_DOT.Delay },
  { key: "On Hold", label: "On Hold", color: STATUS_DOT["On Hold"] },
] as const;

const TYPE_CARDS = [
  { key: "Website", label: "Websites" },
  { key: "Mobapp", label: "Mobapps" },
  { key: "Webapp", label: "Webapps" },
  { key: "UXUI Design", label: "UX/UI" },
  { key: "Branding", label: "Branding" },
] as const;

export function SummaryCards({ projects }: { projects: Project[] }) {
  const statusCounts = countByStatus(projects);
  const typeCounts = countByType(projects);

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {STATUS_CARDS.map((card) => {
          const value = card.key === "total" ? projects.length : statusCounts[card.key];
          return (
            <div
              key={card.key}
              className="rounded-xl border border-border bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className={cn("size-2 rounded-full", card.color)} />
                {card.label}
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {value}
              </p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {TYPE_CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded-lg border border-border/70 bg-white/70 px-3 py-2"
          >
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {card.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground/80">
              {typeCounts[card.key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
