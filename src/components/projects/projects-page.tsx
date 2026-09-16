"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LegacyImportBanner } from "@/components/migrate/legacy-import-banner";
import { CollapsibleSection } from "@/components/projects/collapsible-section";
import { ProjectFilters } from "@/components/projects/project-filters";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectViewSwitcher, type ProjectListView } from "@/components/projects/project-view-switcher";
import { Button } from "@/components/ui/button";
import { matchesDateFilter } from "@/lib/dates";
import { uniqueFieldValues } from "@/lib/projects";
import { SAVE_ERROR_MESSAGE, useProjects } from "@/lib/store";
import { useUiPreference } from "@/lib/ui-preferences";
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
  const [filtersOpen, setFiltersOpen] = useUiPreference<"open" | "closed">(
    "mrfl-pm.projects-filters",
    "open"
  );
  const [listView, setListView] = useUiPreference<ProjectListView>(
    "mrfl-pm.projects-list-view",
    "list"
  );

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

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("All");
    setClientFilter("All");
    setOwnerFilter("All");
    setTypeFilter("All");
    setDateFilter("All");
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

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

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Track status, owners, types, and weekly progress across every project."
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Create Project
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 lg:px-8">
        {loadError ? (
          <div className="rounded-xl border border-border bg-white px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">Unable to load projects</h2>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          </div>
        ) : !ready ? (
          <div>
            <p className="text-sm text-muted-foreground">Loading projects...</p>
            <div className="mt-6 h-10 animate-pulse rounded-xl bg-muted" />
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : (
          <>
            <LegacyImportBanner />

            <div>
              <CollapsibleSection
                title="Filters"
                expanded={filtersOpen === "open"}
                onToggle={() => setFiltersOpen(filtersOpen === "open" ? "closed" : "open")}
              >
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
              </CollapsibleSection>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {filtered.length === projects.length
                  ? `${projects.length} ${projects.length === 1 ? "project" : "projects"}`
                  : `${filtered.length} of ${projects.length} projects`}
              </p>
              <ProjectViewSwitcher value={listView} onChange={setListView} />
            </div>

            <div className="mt-3">
              <ProjectList
                projects={projects}
                filtered={filtered}
                view={listView}
                onCreate={openCreate}
                onClearFilters={clearFilters}
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
          </>
        )}
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
