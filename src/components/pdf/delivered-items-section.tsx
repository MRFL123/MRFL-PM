import { Link, Text, View } from "@react-pdf/renderer";
import { styles } from "@/components/pdf/styles";
import { sortDeliveredItems } from "@/lib/projects";
import type { Project } from "@/lib/types";

export function DeliveredItemsSection({ project }: { project: Project }) {
  const items = sortDeliveredItems(project.deliveredItems ?? []);

  return (
    <View style={styles.card} wrap>
      <Text style={styles.cardTitle}>Delivered Items</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>No delivered items yet.</Text>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.deliveredRow} wrap={false}>
            <Link src={item.url}>
              <Text style={styles.deliveredName}>{item.name}</Text>
            </Link>
            <Link src={item.url}>
              <Text style={styles.deliveredLink}>{item.url}</Text>
            </Link>
          </View>
        ))
      )}
    </View>
  );
}
