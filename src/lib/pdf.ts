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

let brandLogoCache: string | null | undefined;

/** Resolve Mirrorful mark as a data URL for @react-pdf/renderer Image. */
export async function loadBrandLogo(): Promise<string | null> {
  if (brandLogoCache !== undefined) return brandLogoCache;
  try {
    const response = await fetch("/mirrorful-mark.png");
    if (!response.ok) {
      brandLogoCache = null;
      return null;
    }
    const blob = await response.blob();
    brandLogoCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    return brandLogoCache;
  } catch {
    brandLogoCache = null;
    return null;
  }
}
