import { reportFilename, triggerDownload } from "@/lib/pdf";
import type { Project } from "@/lib/types";

let brandLogoCache: string | null | undefined;

async function loadBrandLogo(): Promise<string | null> {
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

export async function exportProjectReport(project: Project): Promise<void> {
  const [{ pdf }, { ProjectReportPDF }, brandLogo] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/project-report-pdf"),
    loadBrandLogo(),
  ]);

  const blob = await pdf(<ProjectReportPDF project={project} brandLogo={brandLogo} />).toBlob();
  triggerDownload(blob, reportFilename(project.name));
}
