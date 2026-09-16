import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";
import { StatusPill } from "@/components/app/status-pill";
import {
  INVOICE_STATUS_STYLES,
  SAMPLE_INVOICES,
  formatCurrency,
  type Invoice,
} from "@/lib/invoices";
import { formatDisplayDate } from "@/lib/dates";

function upcomingInvoices(invoices: Invoice[], limit = 4): Invoice[] {
  return [...invoices]
    .filter((invoice) => invoice.status !== "Paid")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit);
}

export function NextInvoices() {
  const rows = upcomingInvoices(SAMPLE_INVOICES);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
            <ReceiptText className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No upcoming invoices</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Invoices awaiting payment will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href="/invoices"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {invoice.number} · {invoice.client}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {invoice.project} · Due {formatDisplayDate(invoice.dueDate)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(invoice.amount)}
                </span>
                <StatusPill label={invoice.status} className={INVOICE_STATUS_STYLES[invoice.status]} />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
