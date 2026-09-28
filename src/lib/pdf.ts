import { formatIsoDate } from "@/lib/dates";

export function reportFilename(projectName: string, date = new Date()): string {
  const safe = projectName
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
  return `${safe || "Project"}_Weekly_Report_${formatIsoDate(date)}.pdf`;
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Raster image ready for @react-pdf/renderer, with its natural pixel size. */
export type PdfImage = {
  src: string;
  width: number;
  height: number;
};

// Only successful loads are cached so a transient failure (e.g. during a
// deployment swap) never pins a missing logo for the rest of the session.
const pdfImageCache = new Map<string, PdfImage>();

function toAbsoluteUrl(src: string): string {
  if (typeof window === "undefined" || /^(data|blob):/i.test(src)) return src;
  try {
    return new URL(src, window.location.origin).toString();
  } catch {
    return src;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function decodeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load."));
    image.src = src;
  });
}

const MAX_RASTER_DIMENSION = 1200;

/**
 * Load any browser-renderable image (PNG, JPEG, WEBP, GIF, SVG; relative,
 * absolute, or data URL) and return a PNG/JPEG data URL that
 * @react-pdf/renderer can embed, plus its natural size. The image is fully
 * fetched and decoded before the PDF is rendered, so every output
 * (preview, print, download) contains it. Returns null when it cannot load.
 */
export async function loadPdfImage(src: string | null | undefined): Promise<PdfImage | null> {
  const trimmed = src?.trim();
  if (!trimmed || typeof window === "undefined") return null;
  const cached = pdfImageCache.get(trimmed);
  if (cached) return cached;

  let objectUrl: string | null = null;
  try {
    const response = await fetch(toAbsoluteUrl(trimmed));
    if (!response.ok) return null;
    const blob = await response.blob();
    const type = (blob.type || "").toLowerCase();

    let result: PdfImage;
    if (type === "image/png" || type === "image/jpeg" || type === "image/jpg") {
      const dataUrl = await blobToDataUrl(blob);
      const image = await decodeImage(dataUrl);
      result = { src: dataUrl, width: image.naturalWidth, height: image.naturalHeight };
    } else {
      // WEBP/GIF/SVG (or unknown types): rasterize to PNG via canvas.
      objectUrl = URL.createObjectURL(blob);
      const image = await decodeImage(objectUrl);
      const naturalWidth = image.naturalWidth || 512;
      const naturalHeight = image.naturalHeight || 512;
      const scale = Math.min(
        1,
        MAX_RASTER_DIMENSION / Math.max(naturalWidth, naturalHeight),
      );
      // Upscale tiny vector images so they stay crisp in print.
      const vectorBoost = type.includes("svg") && Math.max(naturalWidth, naturalHeight) < 600 ? 2 : 1;
      const width = Math.max(1, Math.round(naturalWidth * scale * vectorBoost));
      const height = Math.max(1, Math.round(naturalHeight * scale * vectorBoost));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(image, 0, 0, width, height);
      result = { src: canvas.toDataURL("image/png"), width, height };
    }

    if (!result.width || !result.height) return null;
    pdfImageCache.set(trimmed, result);
    return result;
  } catch {
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Resolve Mirrorful mark as a data URL for @react-pdf/renderer Image. */
export async function loadBrandLogo(): Promise<string | null> {
  const image = await loadPdfImage("/mirrorful-mark.png");
  return image?.src ?? null;
}

/**
 * Full Mirrorful logo (mark + wordmark) for invoices. Falls back to the mark
 * when the wordmark cannot be loaded.
 */
export async function loadInvoiceBrandLogo(): Promise<PdfImage | null> {
  return (
    (await loadPdfImage("/mirrorful-wordmark.png")) ??
    (await loadPdfImage("/mirrorful-mark.png"))
  );
}

/** Fit natural image dimensions inside a max box, preserving aspect ratio. */
export function fitPdfImage(
  image: Pick<PdfImage, "width" | "height">,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  return {
    width: Math.round(image.width * scale * 100) / 100,
    height: Math.round(image.height * scale * 100) / 100,
  };
}
