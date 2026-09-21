import { loadBrandLogo, triggerDownload } from "@/lib/pdf";
import type { Invoice } from "@/lib/invoices";

export function invoiceFilename(invoice: Invoice): string {
  const safe = invoice.number.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "") || "Invoice";
  return `${safe}.pdf`;
}

export async function exportInvoicePdf(invoice: Invoice): Promise<Blob> {
  const [{ pdf }, { InvoicePDF }, brandLogo] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/invoice-pdf"),
    loadBrandLogo(),
  ]);
  return pdf(<InvoicePDF invoice={invoice} brandLogo={brandLogo} />).toBlob();
}

export async function downloadInvoicePdf(invoice: Invoice): Promise<void> {
  const blob = await exportInvoicePdf(invoice);
  triggerDownload(blob, invoiceFilename(invoice));
}

export async function previewInvoicePdf(invoice: Invoice): Promise<void> {
  const blob = await exportInvoicePdf(invoice);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked. Allow popups to preview the invoice.");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function printInvoicePdf(invoice: Invoice): Promise<void> {
  const blob = await exportInvoicePdf(invoice);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup blocked. Allow popups to print the invoice.");
  }
  win.addEventListener("load", () => {
    win.focus();
    win.print();
  });
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
