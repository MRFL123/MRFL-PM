"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LegacyImportBanner } from "@/components/migrate/legacy-import-banner";
import { ProjectFilters } from "@/components/projects/project-filters";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectList } from "@/components/projects/project-list";
import { SummaryCards } from "@/components/projects/summary-cards";
import { Button } from "@/components/ui/button";
import { matchesDateFilter } from "@/lib/dates";
import { uniqueFieldValues } from "@/lib/projects";
import { SAVE_ERROR_MESSAGE, useProjects } from "@/lib/store";
import type {
  DateFilter,
  Project,
  ProjectInput,
  ProjectType,
  Status,
} from "@/lib/types";

export function ProjectsPage() {
  const { ready, loadError, projects, addProject, updateProject, updateProjectStatus, deleteProject } =
    useProjects();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "All">("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const owners = useMemo(() => uniqueFieldValues(projects, "owner"), [projects]);
  const clients = useMemo(() => uniqueFieldValues(projects, "client"), [projects]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return projects.filter((project) => {
      const haystack = [
        project.name,
        project.client,
        project.owner,
        project.type,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesStatus = statusFilter === "All" || project.status === statusFilter;
      const matchesClient = clientFilter === "All" || project.client === clientFilter;
      const matchesOwner = ownerFilter === "All" || project.owner === ownerFilter;
      const matchesType = typeFilter === "All" || project.type === typeFilter;
      const matchesDate = matchesDateFilter(project, dateFilter);
      return (
        matchesQuery &&
        matchesStatus &&
        matchesClient &&
        matchesOwner &&
        matchesType &&
        matchesDate
      );
    });
  }, [projects, query, statusFilter, clientFilter, ownerFilter, typeFilter, dateFilter]);

  const handleCreate = async (input: ProjectInput) => {
    try {
      await addProject(input);
      toast.success("Project saved successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
      throw error;
    }
  };

  const handleUpdate = async (input: ProjectInput) => {
    if (!editing) return;
    try {
      await updateProject(editing.id, input);
      toast.success("Project saved successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
      throw error;
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6">
        <p className="text-sm text-muted-foreground">Loading projects...</p>
        <div className="mt-6 h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-[88rem] px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Unable to load projects</h1>
        <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6">
      <LegacyImportBanner />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track status, owners, types, and weekly progress across every project.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus data-icon="inline-start" />
          Create Project
        </Button>
      </div>

      <div className="mt-6">
        <SummaryCards projects={projects} />
      </div>

      <div className="mt-6">
        <ProjectFilters
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          clientFilter={clientFilter}
          onClientChange={setClientFilter}
          ownerFilter={ownerFilter}
          onOwnerChange={setOwnerFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          clients={clients}
          owners={owners}
        />
      </div>

      <div className="mt-4">
        <ProjectList
          projects={projects}
          filtered={filtered}
          onCreate={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          onEdit={(project) => {
            setEditing(project);
            setFormOpen(true);
          }}
          onDelete={setDeleting}
          onStatusChange={async (project, status) => {
            try {
              await updateProjectStatus(project.id, status);
              toast.success("Project saved successfully.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
            }
          }}
        />
      </div>

      <ProjectForm
        open={formOpen}
        project={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete project"
        description="Are you sure you want to delete this project?"
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteProject(deleting.id);
            toast.success("Project deleted.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
          }
        }}
      />
    </div>
  );
}
