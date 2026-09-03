"use client";

import { FolderKanban } from "lucide-react";
import { ProjectRow } from "@/components/projects/project-row";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project, Status } from "@/lib/types";

export function ProjectList({
  projects,
  filtered,
  onCreate,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  projects: Project[];
  filtered: Project[];
  onCreate: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onStatusChange: (project: Project, status: Status) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <FolderKanban className="size-5 text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold">No projects yet.</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create a project to track status, weekly updates, and milestones.
        </p>
        <Button className="mt-5" onClick={onCreate}>
          + Create Project
        </Button>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
        No projects match this search or filter.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">Logo</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Next Milestone</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onStatusChange={(status) => onStatusChange(project, status)}
              onEdit={() => onEdit(project)}
              onDelete={() => onDelete(project)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
