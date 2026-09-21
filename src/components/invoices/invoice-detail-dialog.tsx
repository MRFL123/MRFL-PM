"use client";

import { useState } from "react";
import { Download, Eye, Pencil, Printer } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/app/status-pill";
import { DateField } from "@/components/date-field";
import { LogoField } from "@/components/logo-field";
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
import { formatDisplayDate, fromDateInputValue, toDateInputValue } from "@/lib/dates";
import {
  COMPANY_TAX_ID,
  COMPANY_WEBSITE,
  DEFAULT_CURRENCY,
  INVOICE_STATUSES,
  INVOICE_STATUS_STYLES,
  formatCurrency,
  isFinanciallyLocked,
  type Invoice,
  type InvoiceInput,
  type InvoiceStatus,
} from "@/lib/invoices";
import {
  downloadInvoicePdf,
  previewInvoicePdf,
  printInvoicePdf,
} from "@/lib/export-invoice-pdf";

type BusyAction = "download" | "print" | "preview" | "save" | null;

type EditDraft = {
  number: string;
  invoiceDate: string;
  client: string;
  clientLogoUrl: string | null;
  projectName: string;
  milestoneName: string;
  description: string;
  amount: string;
  currency: string;
  paymentNumber: string;
  status: InvoiceStatus;
  companyTaxId: string;
  companyWebsite: string;
};

function toDraft(invoice: Invoice): EditDraft {
  return {
    number: invoice.number,
    invoiceDate: toDateInputValue(invoice.invoiceDate),
    client: invoice.client,
    clientLogoUrl: invoice.clientLogoUrl,
    projectName: invoice.projectName,
    milestoneName: invoice.milestoneName,
    description: invoice.description,
    amount: String(invoice.amount),
    currency: invoice.currency || DEFAULT_CURRENCY,
    paymentNumber: invoice.paymentNumber,
    status: invoice.status,
    companyTaxId: invoice.companyTaxId || COMPANY_TAX_ID,
    companyWebsite: invoice.companyWebsite || COMPANY_WEBSITE,
  };
}

function draftAsInvoice(invoice: Invoice, draft: EditDraft): Invoice {
  const date = fromDateInputValue(draft.invoiceDate) || invoice.invoiceDate;
  const amount = Number(draft.amount);
  return {
    ...invoice,
    number: draft.number.trim() || invoice.number,
    invoiceDate: date,
    client: draft.client.trim(),
    clientLogoUrl: draft.clientLogoUrl,
    projectName: draft.projectName.trim(),
    milestoneName: draft.milestoneName.trim(),
    description: draft.description.trim(),
    amount: Number.isFinite(amount) ? amount : invoice.amount,
    currency: draft.currency.trim() || DEFAULT_CURRENCY,
    paymentNumber: draft.paymentNumber.trim(),
    status: draft.status,
    companyTaxId: draft.companyTaxId.trim() || COMPANY_TAX_ID,
    companyWebsite: draft.companyWebsite.trim() || COMPANY_WEBSITE,
  };
}

function InvoiceDetailBody({
  invoice,
  onOpenChange,
  onUpdate,
  onSaved,
}: {
  invoice: Invoice;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (
    id: string,
    input: Partial<InvoiceInput> & { status?: InvoiceStatus },
  ) => Promise<Invoice>;
  onSaved?: (invoice: Invoice) => void;
}) {
  const [busy, setBusy] = useState<BusyAction>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(() => toDraft(invoice));
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(invoice);

  const display = editing ? draftAsInvoice(current, draft) : current;
  const softLocked = isFinanciallyLocked(current);

  const runPdf = async (action: "download" | "print" | "preview") => {
    setBusy(action);
    try {
      if (action === "download") {
        await downloadInvoicePdf(display);
        toast.success("PDF downloaded.");
      } else if (action === "print") {
        await printInvoicePdf(display);
      } else {
        await previewInvoicePdf(display);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to prepare PDF.");
    } finally {
      setBusy(null);
    }
  };

  const handleCancelEdit = () => {
    setDraft(toDraft(current));
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    const parsedAmount = Number(draft.amount);
    if (!draft.number.trim()) {
      setError("Invoice number is required.");
      return;
    }
    if (!draft.client.trim()) {
      setError("Client name is required.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("Amount must be a valid non-negative number.");
      return;
    }
    const date = fromDateInputValue(draft.invoiceDate);
    if (!date) {
      setError("Invoice date is required.");
      return;
    }

    setBusy("save");
    setError(null);
    try {
      const updated = await onUpdate(current.id, {
        number: draft.number.trim(),
        invoiceDate: date,
        client: draft.client.trim(),
        clientLogoUrl: draft.clientLogoUrl,
        projectName: draft.projectName.trim(),
        milestoneName: draft.milestoneName.trim(),
        description: draft.description.trim(),
        amount: parsedAmount,
        currency: draft.currency.trim() || DEFAULT_CURRENCY,
        paymentNumber: draft.paymentNumber.trim(),
        status: draft.status,
        companyTaxId: draft.companyTaxId.trim() || COMPANY_TAX_ID,
        companyWebsite: draft.companyWebsite.trim() || COMPANY_WEBSITE,
      });
      setCurrent(updated);
      setDraft(toDraft(updated));
      setEditing(false);
      onSaved?.(updated);
      toast.success("Invoice saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save invoice.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editing ? "Edit Invoice" : `Invoice ${current.number}`}
        </DialogTitle>
        <DialogDescription>
          {current.source === "automatic"
            ? "Automatic invoice created when the milestone was delivered. Edits apply only to this invoice."
            : "Manually created invoice."}
        </DialogDescription>
      </DialogHeader>

      {editing ? (
        <div className="grid gap-4 text-sm">
          {softLocked ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This invoice was generated automatically. You can still edit its snapshot
              fields; changes will not update the linked project or milestone.
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-invoice-number">Invoice Number</Label>
              <Input
                id="edit-invoice-number"
                value={draft.number}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, number: event.target.value }))
                }
              />
            </div>
            <DateField
              id="edit-invoice-date"
              label="Invoice Date"
              value={draft.invoiceDate}
              onChange={(value) => setDraft((prev) => ({ ...prev, invoiceDate: value }))}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-invoice-client">Client Name</Label>
            <Input
              id="edit-invoice-client"
              value={draft.client}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, client: event.target.value }))
              }
            />
          </div>

          <LogoField
            name={draft.client || "Client"}
            logo={draft.clientLogoUrl}
            onChange={(logo) => setDraft((prev) => ({ ...prev, clientLogoUrl: logo }))}
            label="Client Logo"
            uploadLabel="+ Upload Client Logo"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-project-name">Project Name</Label>
              <Input
                id="edit-project-name"
                value={draft.projectName}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, projectName: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-milestone-name">Milestone Name</Label>
              <Input
                id="edit-milestone-name"
                value={draft.milestoneName}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, milestoneName: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, amount: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-currency">Currency</Label>
              <Input
                id="edit-currency"
                value={draft.currency}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    currency: event.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-payment">Payment Number</Label>
              <Input
                id="edit-payment"
                value={draft.paymentNumber}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, paymentNumber: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select
                value={draft.status}
                onValueChange={(value) => {
                  if (value) {
                    setDraft((prev) => ({ ...prev, status: value as InvoiceStatus }));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Source</Label>
              <Input value={current.source} disabled className="capitalize" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-tax-id">Company Tax ID</Label>
              <Input
                id="edit-tax-id"
                value={draft.companyTaxId}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, companyTaxId: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-website">Company Website</Label>
              <Input
                id="edit-website"
                value={draft.companyWebsite}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, companyWebsite: event.target.value }))
                }
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : (
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <StatusPill
              label={current.status}
              className={INVOICE_STATUS_STYLES[current.status]}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Client</span>
            <span className="font-medium">{current.client || "—"}</span>
          </div>
          {current.clientLogoUrl ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Client Logo</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.clientLogoUrl}
                alt={current.client || "Client logo"}
                className="max-h-10 max-w-[6rem] object-contain"
              />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium">{current.projectName || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Milestone</span>
            <span className="font-medium">{current.milestoneName || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{formatDisplayDate(current.invoiceDate)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">
              {formatCurrency(current.amount, current.currency)}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{current.description || "—"}</p>
          </div>
          {current.paymentNumber ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Payment #</span>
              <span className="font-medium">{current.paymentNumber}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Source</span>
            <span className="font-medium capitalize">{current.source}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Company Tax ID</span>
            <span className="font-medium">{current.companyTaxId || COMPANY_TAX_ID}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Company Website</span>
            <span className="font-medium">{current.companyWebsite || COMPANY_WEBSITE}</span>
          </div>
          {softLocked ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Automatic invoice — edits change only this invoice snapshot, not the milestone.
            </p>
          ) : null}
        </div>
      )}

      <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void runPdf("preview")}
          >
            <Eye data-icon="inline-start" />
            {busy === "preview" ? "Preparing…" : "Preview PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void runPdf("print")}
          >
            <Printer data-icon="inline-start" />
            {busy === "print" ? "Preparing…" : "Print"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void runPdf("download")}
          >
            <Download data-icon="inline-start" />
            {busy === "download" ? "Preparing…" : "Download PDF"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null}
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={busy !== null || !onUpdate}
                onClick={() => void handleSave()}
              >
                {busy === "save" ? "Saving…" : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={!onUpdate || busy !== null}
              onClick={() => {
                setDraft(toDraft(current));
                setEditing(true);
                setError(null);
              }}
            >
              <Pencil data-icon="inline-start" />
              Edit Invoice
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            disabled={busy !== null}
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

export function InvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
  onUpdate,
  onSaved,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: (
    id: string,
    input: Partial<InvoiceInput> & { status?: InvoiceStatus },
  ) => Promise<Invoice>;
  onSaved?: (invoice: Invoice) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {invoice ? (
          <InvoiceDetailBody
            key={`${invoice.id}:${invoice.updatedAt}:${open ? "open" : "closed"}`}
            invoice={invoice}
            onOpenChange={onOpenChange}
            onUpdate={onUpdate}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
