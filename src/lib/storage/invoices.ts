import { createId } from "@/lib/ids";
import { formatIsoDate } from "@/lib/dates";
import type { Invoice, InvoiceInput, InvoiceSource, InvoiceStatus } from "@/lib/invoices";
import {
  COMPANY_TAX_ID,
  COMPANY_WEBSITE,
  DEFAULT_CURRENCY,
} from "@/lib/invoices";
import { INVOICE_SELECT, mapInvoice, type InvoiceRow } from "@/lib/storage/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SAVE_ERROR = "Unable to save changes. Please try again.";

function throwSaveError(error: { message?: string } | null, fallback = SAVE_ERROR): never {
  throw new Error(error?.message || fallback);
}

/** Columns added by migration 003 (invoice snapshot/override fields). */
const SNAPSHOT_COLUMNS = [
  "project_name",
  "milestone_name",
  "client_logo_url",
  "company_tax_id",
  "company_website",
] as const;

let snapshotColumnsMissing = false;

/**
 * True once Supabase reported that migration 003 columns are missing. Invoices
 * still save (without those fields) and render from live dashboard data.
 */
export function invoiceSnapshotColumnsMissing(): boolean {
  return snapshotColumnsMissing;
}

function isMissingSnapshotColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = error.message ?? "";
  const mentionsColumn = SNAPSHOT_COLUMNS.some((column) => message.includes(column));
  return (
    mentionsColumn &&
    (error.code === "PGRST204" ||
      error.code === "42703" ||
      /schema cache|does not exist|could not find/i.test(message))
  );
}

function withoutSnapshotColumns<T extends Record<string, unknown>>(row: T): T {
  const copy: Record<string, unknown> = { ...row };
  for (const column of SNAPSHOT_COLUMNS) delete copy[column];
  return copy as T;
}

/**
 * Run an insert/update; if it fails only because migration 003 has not been
 * applied, retry once without the snapshot columns instead of failing.
 */
async function writeWithSnapshotFallback(
  row: Record<string, unknown>,
  write: (row: Record<string, unknown>) => PromiseLike<{
    error: { code?: string; message?: string } | null;
  }>,
): Promise<void> {
  const payload = snapshotColumnsMissing ? withoutSnapshotColumns(row) : row;
  if (Object.keys(payload).length === 0) return;
  const { error } = await write(payload);
  if (!error) return;
  if (!snapshotColumnsMissing && isMissingSnapshotColumnError(error)) {
    snapshotColumnsMissing = true;
    const fallback = withoutSnapshotColumns(row);
    if (Object.keys(fallback).length === 0) return;
    const retry = await write(fallback);
    if (retry.error) throwSaveError(retry.error);
    return;
  }
  throwSaveError(error);
}

function formatInvoiceNumber(seq: number): string {
  return `PRC${String(seq).padStart(4, "0")}`;
}

async function nextInvoiceNumber(): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("number")
    .like("number", "PRC%")
    .order("number", { ascending: false })
    .limit(50);

  if (error) throwSaveError(error, "Unable to allocate invoice number.");

  let max = 0;
  for (const row of data ?? []) {
    const match = /^PRC(\d+)$/i.exec(String(row.number ?? ""));
    if (match) {
      const n = Number(match[1]);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return formatInvoiceNumber(max + 1);
}

function snapshotFields(input: InvoiceInput) {
  return {
    project_name: (input.projectName ?? "").trim(),
    milestone_name: (input.milestoneName ?? "").trim(),
    client_logo_url: input.clientLogoUrl ?? null,
    company_tax_id: (input.companyTaxId ?? COMPANY_TAX_ID).trim() || COMPANY_TAX_ID,
    company_website: (input.companyWebsite ?? COMPANY_WEBSITE).trim() || COMPANY_WEBSITE,
  };
}

export const supabaseInvoiceRepository = {
  async list(): Promise<Invoice[]> {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("invoices")
      .select(INVOICE_SELECT)
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throwSaveError(error, "Unable to load invoices. Please try again.");
    return (data as InvoiceRow[] | null)?.map(mapInvoice) ?? [];
  },

  async get(id: string): Promise<Invoice | null> {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throwSaveError(error, "Unable to load invoice.");
    return data ? mapInvoice(data as InvoiceRow) : null;
  },

  async findAutomaticForMilestone(milestoneId: string): Promise<Invoice | null> {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("milestone_id", milestoneId)
      .eq("source", "automatic")
      .maybeSingle();
    if (error) throwSaveError(error, "Unable to look up invoice.");
    return data ? mapInvoice(data as InvoiceRow) : null;
  },

  async create(
    input: InvoiceInput,
    options?: { source?: InvoiceSource; number?: string },
  ): Promise<Invoice> {
    const supabase = createSupabaseBrowserClient();
    const number = options?.number ?? input.number ?? (await nextInvoiceNumber());
    const source = options?.source ?? "manual";
    const id = createId();
    const snapshots = snapshotFields(input);

    await writeWithSnapshotFallback({
      id,
      number,
      invoice_date: input.invoiceDate || formatIsoDate(),
      client: input.client.trim(),
      project_id: input.projectId,
      milestone_id: input.milestoneId,
      description: input.description.trim(),
      amount: Number.isFinite(input.amount) ? Number(input.amount) : 0,
      currency: (input.currency || DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY,
      status: input.status,
      payment_number: (input.paymentNumber ?? "").trim(),
      source,
      ...snapshots,
    }, (row) => supabase.from("invoices").insert(row));

    const created = await this.get(id);
    if (!created) throw new Error("Invoice was created but could not be loaded.");
    return created;
  },

  async update(
    id: string,
    input: Partial<InvoiceInput> & { status?: InvoiceStatus; number?: string },
  ): Promise<Invoice> {
    const supabase = createSupabaseBrowserClient();
    const patch: Record<string, unknown> = {};
    if (input.number !== undefined) patch.number = input.number.trim();
    if (input.invoiceDate !== undefined) patch.invoice_date = input.invoiceDate;
    if (input.client !== undefined) patch.client = input.client.trim();
    if (input.clientLogoUrl !== undefined) patch.client_logo_url = input.clientLogoUrl;
    if (input.projectId !== undefined) patch.project_id = input.projectId;
    if (input.projectName !== undefined) patch.project_name = input.projectName.trim();
    if (input.milestoneId !== undefined) patch.milestone_id = input.milestoneId;
    if (input.milestoneName !== undefined) patch.milestone_name = input.milestoneName.trim();
    if (input.description !== undefined) patch.description = input.description.trim();
    if (input.amount !== undefined) {
      patch.amount = Number.isFinite(input.amount) ? Number(input.amount) : 0;
    }
    if (input.currency !== undefined) {
      patch.currency = (input.currency || DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY;
    }
    if (input.status !== undefined) patch.status = input.status;
    if (input.paymentNumber !== undefined) patch.payment_number = input.paymentNumber.trim();
    if (input.companyTaxId !== undefined) {
      patch.company_tax_id = input.companyTaxId.trim() || COMPANY_TAX_ID;
    }
    if (input.companyWebsite !== undefined) {
      patch.company_website = input.companyWebsite.trim() || COMPANY_WEBSITE;
    }

    await writeWithSnapshotFallback(patch, (row) =>
      supabase.from("invoices").update(row).eq("id", id),
    );

    const updated = await this.get(id);
    if (!updated) throw new Error("Invoice not found after update.");
    return updated;
  },

  async delete(id: string): Promise<void> {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) throwSaveError(error);
  },

  async createAutomaticForDeliveredMilestone(params: {
    projectId: string;
    projectName: string;
    projectClient: string;
    /** Project logo URL used as default invoice client_logo_url (snapshot only). */
    projectLogoUrl?: string | null;
    milestoneId: string;
    milestoneName: string;
    /** Canonical milestone description text (name + description). */
    milestoneDescription?: string;
    price: number;
    currency: string;
  }): Promise<Invoice | null> {
    const existing = await this.findAutomaticForMilestone(params.milestoneId);
    if (existing) return null;

    const projectLogo = (params.projectLogoUrl ?? "").trim() || null;

    return this.create(
      {
        invoiceDate: formatIsoDate(),
        client: params.projectClient,
        clientLogoUrl: projectLogo,
        projectId: params.projectId,
        projectName: params.projectName,
        milestoneId: params.milestoneId,
        milestoneName: params.milestoneName,
        description: params.milestoneDescription || params.milestoneName,
        amount: params.price,
        currency: params.currency || DEFAULT_CURRENCY,
        status: "Issued",
        paymentNumber: "",
        companyTaxId: COMPANY_TAX_ID,
        companyWebsite: COMPANY_WEBSITE,
      },
      { source: "automatic" },
    );
  },
};

export type SupabaseInvoiceRepository = typeof supabaseInvoiceRepository;
