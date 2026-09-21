"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDisplayDate } from "@/lib/dates";
import {
  INVOICE_STATUS_STYLES,
  formatCurrency,
  isFinanciallyLocked,
  type Invoice,
} from "@/lib/invoices";
import { downloadInvoicePdf, printInvoicePdf } from "@/lib/export-invoice-pdf";

export function InvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [busy, setBusy] = useState<"download" | "print" | null>(null);

  if (!invoice) return null;

  const locked = isFinanciallyLocked(invoice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invoice {invoice.number}</DialogTitle>
          <DialogDescription>
            {invoice.source === "automatic"
              ? "Automatic invoice created when the milestone was delivered."
              : "Manually created invoice."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <StatusPill
              label={invoice.status}
              className={INVOICE_STATUS_STYLES[invoice.status]}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Client</span>
            <span className="font-medium">{invoice.client || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium">{invoice.projectName || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Milestone</span>
            <span className="font-medium">{invoice.milestoneName || "—"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{formatDisplayDate(invoice.invoiceDate)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">
              {formatCurrency(invoice.amount, invoice.currency)}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{invoice.description || "—"}</p>
          </div>
          {invoice.paymentNumber ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Payment #</span>
              <span className="font-medium">{invoice.paymentNumber}</span>
            </div>
          ) : null}
          {locked ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Financial fields on Issued / automatic invoices are locked to preserve the
              billed amount.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            disabled={busy !== null}
            onClick={async () => {
              setBusy("print");
              try {
                await printInvoicePdf(invoice);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to print.");
              } finally {
                setBusy(null);
              }
            }}
          >
            <Printer data-icon="inline-start" />
            {busy === "print" ? "Preparing…" : "Print"}
          </Button>
          <Button
            disabled={busy !== null}
            onClick={async () => {
              setBusy("download");
              try {
                await downloadInvoicePdf(invoice);
                toast.success("PDF downloaded.");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to download PDF.");
              } finally {
                setBusy(null);
              }
            }}
          >
            <Download data-icon="inline-start" />
            {busy === "download" ? "Preparing…" : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
