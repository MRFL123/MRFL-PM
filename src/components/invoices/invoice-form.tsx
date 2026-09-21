"use client";

import { useMemo, useState } from "react";
import { DateField } from "@/components/date-field";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatIsoDate, fromDateInputValue, toDateInputValue } from "@/lib/dates";
import {
  DEFAULT_CURRENCY,
  INVOICE_STATUSES,
  type InvoiceInput,
  type InvoiceStatus,
} from "@/lib/invoices";
import type { Project } from "@/lib/types";

function InvoiceFormFields({
  projects,
  onOpenChange,
  onSubmit,
}: {
  projects: Project[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: InvoiceInput) => Promise<void>;
}) {
  const [invoiceDate, setInvoiceDate] = useState(toDateInputValue(formatIsoDate()));
  const [client, setClient] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [milestoneId, setMilestoneId] = useState<string>("none");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [status, setStatus] = useState<InvoiceStatus>("Issued");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projects, projectId],
  );

  const milestones = selectedProject?.milestones ?? [];

  const handleProjectChange = (nextId: string) => {
    setProjectId(nextId);
    setMilestoneId("none");
    if (nextId !== "none") {
      const project = projects.find((row) => row.id === nextId);
      if (project) {
        if (!client.trim()) setClient(project.client);
      }
    }
  };

  const handleMilestoneChange = (nextId: string) => {
    setMilestoneId(nextId);
    if (nextId === "none" || !selectedProject) return;
    const milestone = selectedProject.milestones.find((row) => row.id === nextId);
    if (!milestone) return;
    if (!description.trim()) setDescription(milestone.name);
    if (!amount || amount === "0") setAmount(String(milestone.price ?? 0));
    if (!currency || currency === DEFAULT_CURRENCY) {
      setCurrency(milestone.currency || DEFAULT_CURRENCY);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!client.trim()) {
      setError("Client is required.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("Amount must be a valid non-negative number.");
      return;
    }
    const date = fromDateInputValue(invoiceDate);
    if (!date) {
      setError("Invoice date is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const project =
        projectId === "none" ? null : projects.find((row) => row.id === projectId) ?? null;
      const milestone =
        milestoneId === "none" || !project
          ? null
          : project.milestones.find((row) => row.id === milestoneId) ?? null;
      await onSubmit({
        invoiceDate: date,
        client: client.trim(),
        projectId: project?.id ?? null,
        projectName: project?.name ?? "",
        milestoneId: milestone?.id ?? null,
        milestoneName: milestone?.name ?? "",
        description: description.trim(),
        amount: parsedAmount,
        currency: currency.trim() || DEFAULT_CURRENCY,
        status,
        paymentNumber: paymentNumber.trim(),
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not create invoice.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogDescription>
          Create a manual invoice. Linking a milestone is optional.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DateField
          id="invoice-date"
          label="Invoice Date"
          value={invoiceDate}
          onChange={setInvoiceDate}
        />
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              if (value) setStatus(value as InvoiceStatus);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="invoice-client">Client</Label>
        <Input
          id="invoice-client"
          value={client}
          onChange={(event) => setClient(event.target.value)}
          placeholder="Client name"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Project (optional)</Label>
          <Select value={projectId} onValueChange={(value) => value && handleProjectChange(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Milestone (optional)</Label>
          <Select
            value={milestoneId}
            onValueChange={(value) => value && handleMilestoneChange(value)}
            disabled={!selectedProject}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No milestone</SelectItem>
              {milestones.map((milestone) => (
                <SelectItem key={milestone.id} value={milestone.id}>
                  {milestone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="invoice-description">Description</Label>
        <Textarea
          id="invoice-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="What is being billed"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5 sm:col-span-1">
          <Label htmlFor="invoice-amount">Amount</Label>
          <Input
            id="invoice-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="invoice-currency">Currency</Label>
          <Input
            id="invoice-currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="invoice-payment">Payment #</Label>
          <Input
            id="invoice-payment"
            value={paymentNumber}
            onChange={(event) => setPaymentNumber(event.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create Invoice"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function InvoiceForm({
  open,
  projects,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  projects: Project[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: InvoiceInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {open && (
          <InvoiceFormFields
            key="create-invoice"
            projects={projects}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
