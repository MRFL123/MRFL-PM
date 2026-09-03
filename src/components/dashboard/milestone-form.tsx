"use client";

import { useState } from "react";
import { DateField } from "@/components/date-field";
import { StatusSelect } from "@/components/status-select";
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
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { validateNamedDates } from "@/lib/validation";
import type { Milestone, MilestoneInput, Status } from "@/lib/types";

function MilestoneFormFields({
  milestone,
  onOpenChange,
  onSubmit,
}: {
  milestone?: Milestone | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: MilestoneInput) => Promise<void>;
}) {
  const [name, setName] = useState(milestone?.name ?? "");
  const [status, setStatus] = useState<Status>(milestone?.status ?? "None");
  const [startDate, setStartDate] = useState(toDateInputValue(milestone?.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(milestone?.endDate));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const input: MilestoneInput = {
      name,
      status,
      startDate: fromDateInputValue(startDate),
      endDate: fromDateInputValue(endDate),
    };
    const validationError = validateNamedDates(input, "Milestone name");
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
        submitError instanceof Error ? submitError.message : "Could not save milestone."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{milestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
        <DialogDescription>
          Name the milestone and optionally set its status and dates.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="milestone-name">Milestone Name</Label>
        <Input
          id="milestone-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="MS1: Project Kickoff"
          autoFocus
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Status</Label>
        <StatusSelect value={status} onChange={setStatus} className="w-full" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField
          id="milestone-start"
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
        />
        <DateField
          id="milestone-end"
          label="End Date"
          value={endDate}
          onChange={setEndDate}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : milestone ? "Save Changes" : "Save Milestone"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function MilestoneForm({
  open,
  milestone,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  milestone?: Milestone | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: MilestoneInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <MilestoneFormFields
            key={milestone?.id ?? "create"}
            milestone={milestone}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
