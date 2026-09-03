import { Text, View } from "@react-pdf/renderer";
import { ReportStatusBadge } from "@/components/pdf/report-status-badge";
import { styles } from "@/components/pdf/styles";
import { formatShortDate } from "@/lib/dates";
import { projectProgress, sortMilestones } from "@/lib/projects";
import type { Project } from "@/lib/types";

export function MilestonesTable({ project }: { project: Project }) {
  const milestones = sortMilestones(project.milestones);
  const percent = projectProgress(project);

  return (
    <View style={styles.wideCard} wrap>
      <View style={[styles.progressHeader, styles.cardTitle]} wrap={false}>
        <Text>Project Progress</Text>
        {project.milestones.length > 0 ? (
          <Text style={styles.progressValue}>{percent}%</Text>
        ) : null}
      </View>
      {milestones.length === 0 ? (
        <Text style={styles.empty}>No milestones added yet.</Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeadText, styles.colMilestone]}>NAME</Text>
            <Text style={[styles.tableHeadText, styles.colStatus]}>STATUS</Text>
            <Text style={[styles.tableHeadText, styles.colDate]}>START</Text>
            <Text style={[styles.tableHeadText, styles.colDate]}>END</Text>
          </View>
          {milestones.map((milestone, index) => (
            <View
              key={milestone.id}
              style={[
                styles.tableRow,
                index === milestones.length - 1 ? { borderBottomWidth: 0 } : {},
              ]}
              wrap={false}
            >
              <Text style={[styles.tableCell, styles.colMilestone]}>{milestone.name}</Text>
              <View style={styles.colStatus}>
                <ReportStatusBadge status={milestone.status} />
              </View>
              <Text style={[styles.tableCell, styles.colDate]}>
                {formatShortDate(milestone.startDate) || "—"}
              </Text>
              <Text style={[styles.tableCell, styles.colDate]}>
                {formatShortDate(milestone.endDate) || "—"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
