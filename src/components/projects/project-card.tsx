"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { ProjectLogo } from "@/components/project-logo";
import { ProjectProgress } from "@/components/projects/project-progress";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDisplayDate, formatRelativeUpdated } from "@/lib/dates";
import { displayValue, nextMilestoneLabel, projectProgress } from "@/lib/projects";
import type { Project } from "@/lib/types";

export function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = projectProgress(project);
  const dateRange =
    project.startDate || project.endDate
      ? `${formatDisplayDate(project.startDate)} → ${formatDisplayDate(project.endDate)}`
      : "Dates not set";

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/projects/${project.id}`} className="shrink-0">
          <ProjectLogo name={project.name} logo={project.logo} />
        </Link>
        <StatusBadge status={project.status} />
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="mt-3 text-base font-semibold text-foreground hover:underline"
      >
        {project.name}
      </Link>
      <p className="mt-0.5 truncate text-sm text-muted-foreground">
        {displayValue(project.client)}
      </p>

      <dl className="mt-3 space-y-1 text-sm text-muted-foreground">
        <div>Owner: {displayValue(project.owner)}</div>
        <div>Type: {project.type}</div>
      </dl>

      <div className="mt-4">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Progress
        </p>
        <div className="mt-1.5">
          <ProjectProgress value={progress} barClassName="w-full" />
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground/80">{dateRange}</p>

      <div className="mt-4">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Next Milestone
        </p>
        <p className="mt-0.5 truncate text-sm text-foreground/80">
          {nextMilestoneLabel(project)}
        </p>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Updated {formatRelativeUpdated(project.updatedAt)}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <Link
          href={`/projects/${project.id}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Open Project
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            aria-label={`More actions for ${project.name}`}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
