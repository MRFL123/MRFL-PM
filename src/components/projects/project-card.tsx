"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { ProjectLogo } from "@/components/project-logo";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currentInProgressMilestone, displayValue } from "@/lib/projects";
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
  const router = useRouter();
  const projectHref = `/projects/${project.id}`;
  const currentMilestone = currentInProgressMilestone(project);

  return (
    <article className="flex h-full min-h-[240px] flex-col rounded-xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <Link href={projectHref} className="shrink-0">
          <ProjectLogo name={project.name} logo={project.logo} />
        </Link>
        <StatusBadge status={project.status} />
      </div>

      <Link
        href={projectHref}
        className="mt-4 truncate text-base font-semibold text-foreground hover:underline"
      >
        {project.name}
      </Link>
      <p className="mt-0.5 truncate text-sm text-muted-foreground">
        {displayValue(project.client)}
      </p>

      <div className="mt-4">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Current Milestone
        </p>
        <div className="mt-1 flex items-center gap-2">
          {currentMilestone ? (
            <>
              <span className="size-2 shrink-0 rounded-full bg-sky-500" />
              <span className="truncate text-sm text-foreground/90">{currentMilestone}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <Link
          href={projectHref}
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
            <DropdownMenuItem onClick={() => router.push(projectHref)}>
              <SquareArrowOutUpRight />
              Open Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil />
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
