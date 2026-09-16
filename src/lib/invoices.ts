export const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface Invoice {
  id: string;
  number: string;
  client: string;
  project: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Draft: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  Sent: "bg-sky-50 text-sky-700 ring-sky-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Overdue: "bg-red-50 text-red-700 ring-red-200",
};

// Placeholder data used until invoice persistence is implemented. Kept isolated
// so a future backend can replace this source without touching the UI.
export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "inv-001",
    number: "INV-001",
    client: "Northwind Studio",
    project: "Marketing Website",
    amount: 5000,
    issueDate: "2026-09-01",
    dueDate: "2026-09-12",
    status: "Sent",
  },
  {
    id: "inv-002",
    number: "INV-002",
    client: "Harbor Labs",
    project: "Mobile App v2",
    amount: 12500,
    issueDate: "2026-08-20",
    dueDate: "2026-09-18",
    status: "Sent",
  },
  {
    id: "inv-003",
    number: "INV-003",
    client: "Vertex Retail",
    project: "Brand Refresh",
    amount: 3200,
    issueDate: "2026-08-05",
    dueDate: "2026-08-28",
    status: "Overdue",
  },
  {
    id: "inv-004",
    number: "INV-004",
    client: "Bluepeak",
    project: "Design System",
    amount: 8750,
    issueDate: "2026-07-30",
    dueDate: "2026-08-14",
    status: "Paid",
  },
  {
    id: "inv-005",
    number: "INV-005",
    client: "Cedar & Co.",
    project: "Landing Page",
    amount: 1800,
    issueDate: "2026-09-03",
    dueDate: "2026-09-25",
    status: "Draft",
  },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
