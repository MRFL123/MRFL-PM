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
