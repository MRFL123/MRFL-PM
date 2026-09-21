import { loadBrandLogo, reportFilename, triggerDownload } from "@/lib/pdf";
import type { Project } from "@/lib/types";

export async function exportProjectReport(project: Project): Promise<void> {
  const [{ pdf }, { ProjectReportPDF }, brandLogo] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/project-report-pdf"),
    loadBrandLogo(),
  ]);

  const blob = await pdf(<ProjectReportPDF project={project} brandLogo={brandLogo} />).toBlob();
  triggerDownload(blob, reportFilename(project.name));
}
