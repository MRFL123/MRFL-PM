import { createId } from "@/lib/ids";
import { formatIsoDate } from "@/lib/dates";
import type { Invoice, InvoiceInput, InvoiceSource, InvoiceStatus } from "@/lib/invoices";
import { DEFAULT_CURRENCY } from "@/lib/invoices";
import { INVOICE_SELECT, mapInvoice, type InvoiceRow } from "@/lib/storage/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SAVE_ERROR = "Unable to save changes. Please try again.";

function throwSaveError(error: { message?: string } | null, fallback = SAVE_ERROR): never {
  throw new Error(error?.message || fallback);
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
    const number = options?.number ?? (await nextInvoiceNumber());
    const source = options?.source ?? "manual";
    const id = createId();

    const { error } = await supabase.from("invoices").insert({
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
    });
    if (error) throwSaveError(error);

    const created = await this.get(id);
    if (!created) throw new Error("Invoice was created but could not be loaded.");
    return created;
  },

  async update(id: string, input: Partial<InvoiceInput> & { status?: InvoiceStatus }): Promise<Invoice> {
    const supabase = createSupabaseBrowserClient();
    const patch: Record<string, unknown> = {};
    if (input.invoiceDate !== undefined) patch.invoice_date = input.invoiceDate;
    if (input.client !== undefined) patch.client = input.client.trim();
    if (input.projectId !== undefined) patch.project_id = input.projectId;
    if (input.milestoneId !== undefined) patch.milestone_id = input.milestoneId;
    if (input.description !== undefined) patch.description = input.description.trim();
    if (input.amount !== undefined) {
      patch.amount = Number.isFinite(input.amount) ? Number(input.amount) : 0;
    }
    if (input.currency !== undefined) {
      patch.currency = (input.currency || DEFAULT_CURRENCY).trim() || DEFAULT_CURRENCY;
    }
    if (input.status !== undefined) patch.status = input.status;
    if (input.paymentNumber !== undefined) patch.payment_number = input.paymentNumber.trim();

    const { error } = await supabase.from("invoices").update(patch).eq("id", id);
    if (error) throwSaveError(error);

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
    projectClient: string;
    milestoneId: string;
    milestoneName: string;
    price: number;
    currency: string;
  }): Promise<Invoice | null> {
    const existing = await this.findAutomaticForMilestone(params.milestoneId);
    if (existing) return null;

    return this.create(
      {
        invoiceDate: formatIsoDate(),
        client: params.projectClient,
        projectId: params.projectId,
        milestoneId: params.milestoneId,
        description: params.milestoneName,
        amount: params.price,
        currency: params.currency || DEFAULT_CURRENCY,
        status: "Issued",
        paymentNumber: "",
      },
      { source: "automatic" },
    );
  },
};

export type SupabaseInvoiceRepository = typeof supabaseInvoiceRepository;
