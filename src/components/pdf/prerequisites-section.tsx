import { Text, View } from "@react-pdf/renderer";
import { styles } from "@/components/pdf/styles";
import type { Project } from "@/lib/types";

export function PrerequisitesSection({ project }: { project: Project }) {
  const items = project.dashboard.card2.checklistItems;
  const title = project.dashboard.card2.title.trim() || "Prerequisite (client)";

  return (
    <View style={styles.card} wrap>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No prerequisites added yet.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.checkRow} wrap={false}>
            <Text
              style={[
                styles.checkMark,
                { color: item.completed ? "#047857" : "#B91C1C" },
              ]}
            >
              {item.completed ? "✓" : "✕"}
            </Text>
            <Text style={styles.checkText}>{item.text || "Untitled item"}</Text>
          </View>
        ))
      )}
    </View>
  );
}
