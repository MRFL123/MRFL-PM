"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, Plus, ReceiptText, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import { InvoiceDetailDialog } from "@/components/invoices/invoice-detail-dialog";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  INVOICE_STATUSES,
  INVOICE_STATUS_STYLES,
  formatCurrency,
  type Invoice,
  type InvoiceStatus,
} from "@/lib/invoices";
import { SAVE_ERROR_MESSAGE, useProjects } from "@/lib/store";

type SortKey = "number" | "date" | "amount" | "client" | "status";

export function InvoicesPage() {
  const { ready, loadError, invoices, projects, createInvoice, updateInvoice } = useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "All">("All");
  const [clientFilter, setClientFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const clients = useMemo(() => {
    const set = new Set<string>();
    for (const invoice of invoices) {
      if (invoice.client.trim()) set.add(invoice.client.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [invoices]);

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects) map.set(project.id, project.name);
    for (const invoice of invoices) {
      if (invoice.projectId && invoice.projectName) {
        map.set(invoice.projectId, invoice.projectName);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [projects, invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = invoices.filter((invoice) => {
      if (statusFilter !== "All" && invoice.status !== statusFilter) return false;
      if (clientFilter !== "All" && invoice.client !== clientFilter) return false;
      if (projectFilter !== "All" && invoice.projectId !== projectFilter) return false;
      if (dateFrom && invoice.invoiceDate < dateFrom) return false;
      if (dateTo && invoice.invoiceDate > dateTo) return false;
      if (!q) return true;
      const haystack = [
        invoice.number,
        invoice.client,
        invoice.projectName,
        invoice.description,
        invoice.paymentNumber,
        invoice.source,
        invoice.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "number":
          cmp = a.number.localeCompare(b.number);
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "client":
          cmp = a.client.localeCompare(b.client);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "date":
        default:
          cmp = a.invoiceDate.localeCompare(b.invoiceDate);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [
    invoices,
    query,
    statusFilter,
    clientFilter,
    projectFilter,
    dateFrom,
    dateTo,
    sortKey,
    sortDir,
  ]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" || key === "amount" ? "desc" : "asc");
    }
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Track billing across your projects."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus data-icon="inline-start" />
            New Invoice
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 lg:px-8">
        {loadError ? (
          <div className="rounded-xl border border-border bg-white px-6 py-12 text-center">
            <h2 className="text-base font-semibold">Unable to load invoices</h2>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          </div>
        ) : !ready ? (
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        ) : (
          <>
            <div className="mb-4 space-y-3 rounded-xl border border-border bg-white p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search invoices, clients, projects…"
                  className="pl-8"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    if (value) setStatusFilter(value as InvoiceStatus | "All");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All statuses</SelectItem>
                    {INVOICE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={clientFilter}
                  onValueChange={(value) => {
                    if (value) setClientFilter(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={projectFilter}
                  onValueChange={(value) => {
                    if (value) setProjectFilter(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All projects</SelectItem>
                    {projectOptions.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  aria-label="From date"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  aria-label="To date"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                  <ReceiptText className="size-5 text-muted-foreground" />
                </div>
                <h2 className="text-base font-semibold">
                  {invoices.length === 0 ? "No invoices yet" : "No matching invoices"}
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {invoices.length === 0
                    ? "Create an invoice or mark a milestone as Delivered to generate one automatically."
                    : "Try adjusting filters or search."}
                </p>
                {invoices.length === 0 ? (
                  <Button className="mt-5" onClick={() => setFormOpen(true)}>
                    <Plus data-icon="inline-start" />
                    New Invoice
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>
                        <SortButton
                          label="Invoice #"
                          active={sortKey === "number"}
                          onClick={() => toggleSort("number")}
                        />
                      </TableHead>
                      <TableHead>
                        <SortButton
                          label="Client"
                          active={sortKey === "client"}
                          onClick={() => toggleSort("client")}
                        />
                      </TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">
                        <SortButton
                          label="Amount"
                          active={sortKey === "amount"}
                          onClick={() => toggleSort("amount")}
                          className="ml-auto"
                        />
                      </TableHead>
                      <TableHead>
                        <SortButton
                          label="Date"
                          active={sortKey === "date"}
                          onClick={() => toggleSort("date")}
                        />
                      </TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>
                        <SortButton
                          label="Status"
                          active={sortKey === "status"}
                          onClick={() => toggleSort("status")}
                        />
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium text-foreground">
                          {invoice.number}
                        </TableCell>
                        <TableCell>{invoice.client || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {invoice.projectName || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDisplayDate(invoice.invoiceDate)}
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">
                          {invoice.source}
                        </TableCell>
                        <TableCell>
                          <StatusPill
                            label={invoice.status}
                            className={INVOICE_STATUS_STYLES[invoice.status]}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewing(invoice)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>

      <InvoiceForm
        open={formOpen}
        projects={projects}
        onOpenChange={setFormOpen}
        onSubmit={async (input) => {
          try {
            const created = await createInvoice(input);
            toast.success(`Invoice ${created.number} created.`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
            throw error;
          }
        }}
      />

      <InvoiceDetailDialog
        invoice={viewing}
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        onUpdate={updateInvoice}
        onSaved={(invoice) => setViewing(invoice)}
      />
    </div>
  );
}

function SortButton({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-left ${className ?? ""}`}
    >
      {label}
      <ArrowDownUp className={`size-3.5 ${active ? "text-foreground" : "text-muted-foreground/60"}`} />
    </button>
  );
}
