"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ProjectLogo } from "@/components/project-logo";
import { StatusSelect } from "@/components/status-select";
import { TypeBadge } from "@/components/type-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatLastUpdated, formatShortDate } from "@/lib/dates";
import { displayValue, nextMilestoneLabel, projectProgress } from "@/lib/projects";
import type { Project, Status } from "@/lib/types";

export function ProjectRow({
  project,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  project: Project;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progress = projectProgress(project);

  return (
    <TableRow>
      <TableCell>
        <Link href={`/projects/${project.id}`} className="block">
          <ProjectLogo name={project.name} logo={project.logo} />
        </Link>
      </TableCell>
      <TableCell className="min-w-[9rem] font-medium">
        <Link
          href={`/projects/${project.id}`}
          className="text-foreground hover:underline"
        >
          {project.name}
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">{displayValue(project.client)}</TableCell>
      <TableCell className="text-muted-foreground">{displayValue(project.owner)}</TableCell>
      <TableCell>
        <TypeBadge type={project.type} />
      </TableCell>
      <TableCell>
        <StatusSelect compact value={project.status} onChange={onStatusChange} />
      </TableCell>
      <TableCell className="min-w-[7rem]">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatShortDate(project.startDate) || "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatShortDate(project.endDate) || "—"}
      </TableCell>
      <TableCell className="max-w-[10rem] truncate text-muted-foreground">
        {nextMilestoneLabel(project)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatLastUpdated(project.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Link
            href={`/projects/${project.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Open
          </Link>
          <Button size="icon-sm" variant="ghost" aria-label="Edit project" onClick={onEdit}>
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Delete project"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
