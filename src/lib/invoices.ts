export const INVOICE_STATUSES = [
  "Draft",
  "Issued",
  "Paid",
  "Overdue",
  "Cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_SOURCES = ["automatic", "manual"] as const;

export type InvoiceSource = (typeof INVOICE_SOURCES)[number];

export const DEFAULT_CURRENCY = "EGP";
export const COMPANY_TAX_ID = "233421";
export const COMPANY_WEBSITE = "www.themirrorful.com";

export interface Invoice {
  id: string;
  number: string;
  invoiceDate: string;
  client: string;
  clientLogoUrl: string | null;
  projectId: string | null;
  projectName: string;
  milestoneId: string | null;
  milestoneName: string;
  description: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  paymentNumber: string;
  source: InvoiceSource;
  companyTaxId: string;
  companyWebsite: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceInput {
  number?: string;
  invoiceDate: string;
  client: string;
  clientLogoUrl?: string | null;
  projectId: string | null;
  projectName?: string;
  milestoneId: string | null;
  milestoneName?: string;
  description: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  paymentNumber: string;
  companyTaxId?: string;
  companyWebsite?: string;
}

export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  Draft: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  Issued: "bg-sky-50 text-sky-700 ring-sky-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Overdue: "bg-red-50 text-red-700 ring-red-200",
  Cancelled: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

export function formatCurrency(amount: number, currency = DEFAULT_CURRENCY): string {
  try {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/** Soft warning only — does not block editing of snapshot fields. */
export function isFinanciallyLocked(invoice: Pick<Invoice, "status" | "source">): boolean {
  return invoice.source === "automatic";
}

export function upcomingInvoices(invoices: Invoice[], limit = 4): Invoice[] {
  return [...invoices]
    .filter((invoice) => invoice.status !== "Paid" && invoice.status !== "Cancelled")
    .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate))
    .slice(0, limit);
}

export function invoiceForMilestone(
  invoices: Invoice[],
  milestoneId: string,
): Invoice | undefined {
  return invoices.find(
    (invoice) => invoice.milestoneId === milestoneId && invoice.source === "automatic",
  );
}
