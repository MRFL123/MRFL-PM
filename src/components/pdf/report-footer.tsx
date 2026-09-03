import { Text, View } from "@react-pdf/renderer";
import { styles } from "@/components/pdf/styles";
import { formatGeneratedDate } from "@/lib/dates";
import type { Project } from "@/lib/types";

export function ReportFooter({ project }: { project: Project }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={[styles.footerText, { width: "42%" }]}>
        Mirrorful · {project.name}
      </Text>
      <Text style={[styles.footerText, { width: "32%", textAlign: "center" }]}>
        Generated on {formatGeneratedDate()}
      </Text>
      <Text
        style={[styles.footerText, { width: "26%", textAlign: "right" }]}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}
