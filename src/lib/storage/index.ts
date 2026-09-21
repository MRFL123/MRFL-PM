import { supabaseInvoiceRepository } from "@/lib/storage/invoices";
import { supabaseProjectRepository } from "@/lib/storage/supabase";

export const projectRepository = supabaseProjectRepository;
export const invoiceRepository = supabaseInvoiceRepository;
