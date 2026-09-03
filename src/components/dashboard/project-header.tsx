"use client";

import Link from "next/link";
import { ArrowLeft, FileDown, Pencil } from "lucide-react";
import { ProjectLogo } from "@/components/project-logo";
import { StatusBadge } from "@/components/status-badge";
import { TypeBadge } from "@/components/type-badge";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/dates";
import { displayValue } from "@/lib/projects";
import type { Project } from "@/lib/types";

export function ProjectHeader({
  project,
  editing,
  onEditProject,
  onToggleEdit,
  onSave,
  onCancel,
  onExportPdf,
  exporting,
}: {
  project: Project;
  editing: boolean;
  onEditProject: () => void;
  onToggleEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onExportPdf: () => void;
  exporting: boolean;
}) {
  const dateRange =
    project.startDate || project.endDate
      ? `${formatDisplayDate(project.startDate)} → ${formatDisplayDate(project.endDate)}`
      : "Dates not set";

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Projects
        </Link>
        <div className="mt-4 flex items-start gap-4">
          <ProjectLogo name={project.name} logo={project.logo} size="md" className="size-20" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
              <StatusBadge status={project.status} className="text-xs" />
              <TypeBadge type={project.type} className="text-xs" />
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>Client: {displayValue(project.client)}</p>
              <p>Owner: {displayValue(project.owner)}</p>
              <p>{dateRange}</p>
              {project.description.trim() && (
                <p className="max-w-xl text-foreground/80">{project.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onEditProject}>
          <Pencil data-icon="inline-start" />
          Edit Project
        </Button>
        <Button variant="outline" onClick={onExportPdf} disabled={exporting}>
          <FileDown data-icon="inline-start" />
          {exporting ? "Exporting..." : "Export PDF"}
        </Button>
        {editing ? (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSave}>Save Changes</Button>
          </>
        ) : (
          <Button onClick={onToggleEdit}>Edit Dashboard</Button>
        )}
      </div>
    </header>
  );
}
