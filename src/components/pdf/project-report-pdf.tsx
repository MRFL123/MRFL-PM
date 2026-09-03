import { Document, Page, View } from "@react-pdf/renderer";
import { DeliveredItemsSection } from "@/components/pdf/delivered-items-section";
import { MilestonesTable } from "@/components/pdf/milestones-table";
import { PrerequisitesSection } from "@/components/pdf/prerequisites-section";
import { ReportFooter } from "@/components/pdf/report-footer";
import { ReportHeader } from "@/components/pdf/report-header";
import { styles } from "@/components/pdf/styles";
import { WeeklyUpdatesSection } from "@/components/pdf/weekly-updates-section";
import type { Project } from "@/lib/types";

export function ProjectReportPDF({
  project,
  brandLogo,
}: {
  project: Project;
  brandLogo?: string | null;
}) {
  return (
    <Document
      title={`${project.name} Weekly Project Report`}
      author={project.owner || "Mirrorful"}
      creator="Mirrorful"
    >
      <Page size="A4" style={styles.page} wrap>
        <ReportFooter project={project} />
        <ReportHeader project={project} brandLogo={brandLogo} />
        <View style={styles.cardRow} wrap={false}>
          <WeeklyUpdatesSection project={project} />
          <PrerequisitesSection project={project} />
          <DeliveredItemsSection project={project} />
        </View>
        <MilestonesTable project={project} />
      </Page>
    </Document>
  );
}
