import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { StatusPill } from "@/components/app/status-pill";
import { ProjectLogo } from "@/components/project-logo";
import { getDueMilestones, type DueTone } from "@/lib/dashboard";
import { formatDisplayDate } from "@/lib/dates";
import { displayValue } from "@/lib/projects";
import type { Project } from "@/lib/types";

const TONE_STYLES: Record<DueTone, string> = {
  overdue: "bg-red-50 text-red-700 ring-red-200",
  soon: "bg-amber-50 text-amber-700 ring-amber-200",
  upcoming: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function DueMilestones({ projects }: { projects: Project[] }) {
  const rows = getDueMilestones(projects);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No upcoming milestones</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Milestones with a due date will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map(({ project, milestone, dueLabel, tone }) => (
            <li key={`${project.id}-${milestone.id}`}>
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <ProjectLogo name={project.name} logo={project.logo} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{milestone.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {project.name}
                    {project.client.trim() ? ` · ${displayValue(project.client)}` : ""}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="text-xs font-medium text-foreground">
                    {formatDisplayDate(milestone.endDate)}
                  </p>
                </div>
                <StatusPill label={dueLabel} className={TONE_STYLES[tone]} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
