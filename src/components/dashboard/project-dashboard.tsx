"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DeliveredItemsCard } from "@/components/dashboard/delivered-items-card";
import { EditableContentCard } from "@/components/dashboard/editable-content-card";
import { MilestoneTable } from "@/components/dashboard/milestone-table";
import { PrerequisiteCard } from "@/components/dashboard/prerequisite-card";
import { ProjectHeader } from "@/components/dashboard/project-header";
import { ProjectForm } from "@/components/projects/project-form";
import { buttonVariants } from "@/components/ui/button";
import { exportProjectReport } from "@/lib/export-pdf";
import { SAVE_ERROR_MESSAGE, useProjects } from "@/lib/store";
import type { ProjectDashboardData, ProjectInput } from "@/lib/types";

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const { ready, getProject, updateProject, updateDashboard } = useProjects();
  const project = getProject(projectId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProjectDashboardData | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dashboard = editing && draft ? draft : project?.dashboard;

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm text-muted-foreground">Loading project...</p>
        <div className="mt-4 h-8 w-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!project || !dashboard) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted, or the link is no longer valid.
        </p>
        <Link href="/projects" className={`mt-6 ${buttonVariants()}`}>
          Back to Projects
        </Link>
      </div>
    );
  }

  const startEdit = () => {
    setDraft(structuredClone(project.dashboard));
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!draft) return;
    try {
      await updateDashboard(project.id, draft);
      setDraft(null);
      setEditing(false);
      toast.success("Project saved successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
    }
  };

  const exportPdf = async () => {
    if (!project) return;
    setExporting(true);
    try {
      const snapshot = editing && draft
        ? { ...project, dashboard: draft, updatedAt: new Date().toISOString() }
        : project;
      if (editing && draft) {
        await updateDashboard(project.id, draft);
        setDraft(null);
        setEditing(false);
        toast.success("Project saved successfully.");
      }
      await exportProjectReport(snapshot);
      toast.success("PDF exported successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <ProjectHeader
        project={project}
        editing={editing}
        onEditProject={() => setProjectFormOpen(true)}
        onToggleEdit={startEdit}
        onSave={saveEdit}
        onCancel={cancelEdit}
        onExportPdf={exportPdf}
        exporting={exporting}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <EditableContentCard
          card={dashboard.card1}
          editing={editing}
          onChange={(card1) =>
            setDraft((current) => ({ ...(current ?? dashboard), card1 }))
          }
        />
        <PrerequisiteCard
          card={dashboard.card2}
          editing={editing}
          onChange={(updater) =>
            setDraft((current) => {
              const base = current ?? dashboard;
              return { ...base, card2: updater(base.card2) };
            })
          }
        />
        <DeliveredItemsCard project={project} />
      </div>

      <div className="mt-4">
        <MilestoneTable project={project} />
      </div>

      <ProjectForm
        open={projectFormOpen}
        project={project}
        onOpenChange={setProjectFormOpen}
        onSubmit={async (input: ProjectInput) => {
          try {
            await updateProject(project.id, input);
            toast.success("Project saved successfully.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
            throw error;
          }
        }}
      />
    </div>
  );
}
