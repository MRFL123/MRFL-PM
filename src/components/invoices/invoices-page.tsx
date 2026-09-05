"use client";

import { Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDisplayDate } from "@/lib/dates";
import {
  INVOICE_STATUS_STYLES,
  SAMPLE_INVOICES,
  formatCurrency,
} from "@/lib/invoices";

export function InvoicesPage() {
  const invoices = SAMPLE_INVOICES;

  const comingSoon = () => toast.info("Invoice management is coming soon.");

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Track billing across your projects."
        actions={
          <Button onClick={comingSoon}>
            <Plus data-icon="inline-start" />
            New Invoice
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 lg:px-8">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <ReceiptText className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold">No invoices yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create an invoice to start tracking billing for your projects.
            </p>
            <Button className="mt-5" onClick={comingSoon}>
              <Plus data-icon="inline-start" />
              New Invoice
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-foreground">{invoice.number}</TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell className="text-muted-foreground">{invoice.project}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDisplayDate(invoice.issueDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDisplayDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        label={invoice.status}
                        className={INVOICE_STATUS_STYLES[invoice.status]}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={comingSoon}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
