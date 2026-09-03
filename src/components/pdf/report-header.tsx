/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt */
import { Image, Text, View } from "@react-pdf/renderer";
import { ReportStatusBadge } from "@/components/pdf/report-status-badge";
import { styles } from "@/components/pdf/styles";
import { formatDisplayDate } from "@/lib/dates";
import { TYPE_LABELS } from "@/lib/project-type";
import { displayValue, projectInitials } from "@/lib/projects";
import { isPdfSafeImage } from "@/lib/rich-text";
import type { Project } from "@/lib/types";

export function ReportHeader({
  project,
  brandLogo,
}: {
  project: Project;
  brandLogo?: string | null;
}) {
  const safeLogo = project.logo && isPdfSafeImage(project.logo) ? project.logo : null;
  const dateRange =
    project.startDate || project.endDate
      ? `${formatDisplayDate(project.startDate)}  →  ${formatDisplayDate(project.endDate)}`
      : "Dates not set";

  return (
    <View wrap={false}>
      <View style={styles.brandBar}>
        {brandLogo ? <Image src={brandLogo} style={styles.brandMark} /> : null}
        <Text style={styles.brandName}>MIRRORFUL</Text>
        <Text style={styles.brandTag}>Weekly Project Report</Text>
      </View>
    <View style={styles.header}>
      {safeLogo ? (
        <Image src={safeLogo} style={styles.headerLogo} />
      ) : (
        <View style={styles.initials}>
          <Text style={styles.initialsText}>{projectInitials(project.name)}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.projectName}>{project.name}</Text>
        <View style={styles.badgeRow}>
          <ReportStatusBadge status={project.status} />
          <View
            style={[
              styles.badge,
              { backgroundColor: "#EEF2FF", borderColor: "#C7D2FE" },
            ]}
          >
            <Text style={[styles.badgeText, { color: "#3730A3" }]}>
              {TYPE_LABELS[project.type]}
            </Text>
          </View>
        </View>
        <Text style={styles.metaText}>Client: {displayValue(project.client)}</Text>
        <Text style={styles.metaText}>Owner: {displayValue(project.owner)}</Text>
        <Text style={styles.metaText}>{dateRange}</Text>
      </View>
    </View>
    </View>
  );
}
