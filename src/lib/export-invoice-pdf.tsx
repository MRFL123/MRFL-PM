import { loadInvoiceBrandLogo, loadPdfImage, triggerDownload } from "@/lib/pdf";
import type { Invoice } from "@/lib/invoices";

export function invoiceFilename(invoice: Invoice): string {
  const safe = invoice.number.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "") || "Invoice";
  return `${safe}.pdf`;
}

/**
 * Single renderer for every invoice output (Preview, Print, Download).
 * Both logos are fetched and decoded into embeddable data URLs *before*
 * rendering, so the PDF never ships with a missing or placeholder logo.
 */
export async function exportInvoicePdf(invoice: Invoice): Promise<Blob> {
  const [{ pdf }, { InvoicePDF }, brandLogo, clientLogo] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/invoice-pdf"),
    loadInvoiceBrandLogo(),
    loadPdfImage(invoice.clientLogoUrl),
  ]);
  return pdf(
    <InvoicePDF invoice={invoice} brandLogo={brandLogo} clientLogo={clientLogo} />,
  ).toBlob();
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

function openPdfForPrint(url: string): void {
  const win = window.open(url, "_blank");
  if (!win) {
    throw new Error("Popup blocked. Allow popups to print the invoice.");
  }
  win.addEventListener("load", () => {
    win.focus();
    win.print();
  });
}

/** Safari/iOS print embedded PDFs as blank pages; use a tab there instead. */
function canPrintEmbeddedPdf(): boolean {
  const ua = navigator.userAgent;
  const isAppleWebKit = /AppleWebKit/i.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/i.test(ua);
  const isIOS = /iPad|iPhone|iPod/i.test(ua);
  return !isAppleWebKit && !isIOS;
}

/**
 * Print the exact same PDF used by Preview/Download. The PDF is loaded into a
 * hidden same-origin iframe and printed once it has finished loading; if the
 * browser cannot print an embedded PDF, fall back to opening it in a tab.
 */
export async function printInvoicePdf(invoice: Invoice): Promise<void> {
  const blob = await exportInvoicePdf(invoice);
  const url = URL.createObjectURL(blob);

  if (!canPrintEmbeddedPdf()) {
    try {
      openPdfForPrint(url);
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const cleanup = (frame?: HTMLIFrameElement) => {
    setTimeout(() => {
      frame?.remove();
      URL.revokeObjectURL(url);
    }, 60_000);
  };

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.title = `Print ${invoice.number}`;
  Object.assign(frame.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    opacity: "0",
    pointerEvents: "none",
  });

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (printFrame: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      try {
        printFrame();
        resolve();
      } catch {
        try {
          openPdfForPrint(url);
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    };
    // If the embedded viewer never reports "loaded", fall back to a tab.
    const timeout = window.setTimeout(() => {
      finish(() => {
        throw new Error("Print frame timed out.");
      });
    }, 10_000);

    frame.onload = () => {
      // Give the built-in PDF viewer a moment to lay out pages.
      window.setTimeout(() => {
        finish(() => {
          const target = frame.contentWindow;
          if (!target) throw new Error("Print frame unavailable.");
          target.focus();
          target.print();
        });
      }, 300);
    };
    frame.src = url;
    document.body.append(frame);
  });
  cleanup(frame);
}
