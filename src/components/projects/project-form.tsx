"use client";

import { useState } from "react";
import { DateField } from "@/components/date-field";
import { LogoField } from "@/components/logo-field";
import { StatusSelect } from "@/components/status-select";
import { TypeSelect } from "@/components/type-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { validateProjectInput } from "@/lib/validation";
import type { Project, ProjectInput, ProjectType, Status } from "@/lib/types";

function ProjectFormFields({
  project,
  onOpenChange,
  onSubmit,
}: {
  project?: Project | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ProjectInput) => Promise<void>;
}) {
  const [name, setName] = useState(project?.name ?? "");
  const [client, setClient] = useState(project?.client ?? "");
  const [owner, setOwner] = useState(project?.owner ?? "");
  const [type, setType] = useState<ProjectType>(project?.type ?? "Website");
  const [logo, setLogo] = useState<string | null>(project?.logo ?? null);
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<Status>(project?.status ?? "None");
  const [startDate, setStartDate] = useState(toDateInputValue(project?.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(project?.endDate));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const input: ProjectInput = {
      name,
      client,
      owner,
      type,
      logo,
      description,
      status,
      startDate: fromDateInputValue(startDate),
      endDate: fromDateInputValue(endDate),
    };
    const validationError = validateProjectInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(input);
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save project."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
        <DialogDescription>
          {project
            ? "Update project details, owner, type, or logo."
            : "Add a project with owner, type, and optional logo."}
        </DialogDescription>
      </DialogHeader>

      <LogoField name={name} logo={logo} onChange={setLogo} />

      <div className="grid gap-1.5">
        <Label htmlFor="project-name">Project Name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="AlWaseet"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="project-client">Client</Label>
          <Input
            id="project-client"
            value={client}
            onChange={(event) => setClient(event.target.value)}
            placeholder="AlWaseet"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="project-owner">Project Owner</Label>
          <Input
            id="project-owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            placeholder="Maher"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Project Type</Label>
          <TypeSelect value={type} onChange={setType} />
        </div>
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <StatusSelect value={status} onChange={setStatus} className="w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField
          id="project-start"
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
        />
        <DateField
          id="project-end"
          label="End Date"
          value={endDate}
          onChange={setEndDate}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short project notes"
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : project ? "Save Changes" : "Create Project"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ProjectForm({
  open,
  project,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  project?: Project | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ProjectInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {open && (
          <ProjectFormFields
            key={project?.id ?? "create"}
            project={project}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
