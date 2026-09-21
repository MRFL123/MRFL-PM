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
import { Textarea } from "@/components/ui/textarea";
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";
import { DEFAULT_CURRENCY } from "@/lib/invoices";
import { validateNamedDates } from "@/lib/validation";
import type { Milestone, MilestoneInput, Status } from "@/lib/types";

function MilestoneFormFields({
  milestone,
  hasAutomaticInvoice,
  onOpenChange,
  onSubmit,
}: {
  milestone?: Milestone | null;
  hasAutomaticInvoice?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: MilestoneInput) => Promise<void>;
}) {
  const [name, setName] = useState(milestone?.name ?? "");
  const [description, setDescription] = useState(milestone?.description ?? "");
  const [price, setPrice] = useState(
    milestone ? String(milestone.price ?? 0) : "0",
  );
  const [currency, setCurrency] = useState(milestone?.currency || DEFAULT_CURRENCY);
  const [status, setStatus] = useState<Status>(milestone?.status ?? "None");
  const [startDate, setStartDate] = useState(toDateInputValue(milestone?.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(milestone?.endDate));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const priceChanged =
    Boolean(milestone) &&
    Number(price) !== Number(milestone?.price ?? 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }
    const input: MilestoneInput = {
      name,
      description,
      price: parsedPrice,
      currency: currency.trim() || DEFAULT_CURRENCY,
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
          Name the milestone, set billing details, and optionally set status and dates.
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
        <Label htmlFor="milestone-description">Description</Label>
        <Textarea
          id="milestone-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional billing description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="milestone-price">Price</Label>
          <Input
            id="milestone-price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="milestone-currency">Currency</Label>
          <Input
            id="milestone-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            placeholder={DEFAULT_CURRENCY}
          />
        </div>
      </div>

      {hasAutomaticInvoice && priceChanged ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          An automatic invoice already exists for this milestone. Changing the price will
          not update the invoice amount.
        </p>
      ) : null}

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
  hasAutomaticInvoice = false,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  milestone?: Milestone | null;
  hasAutomaticInvoice?: boolean;
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
            hasAutomaticInvoice={hasAutomaticInvoice}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
