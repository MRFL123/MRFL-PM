import { Text, View } from "@react-pdf/renderer";
import { statusPalette, styles } from "@/components/pdf/styles";
import { STATUS_LABELS } from "@/lib/status";
import type { Status } from "@/lib/types";

export function ReportStatusBadge({ status }: { status: Status }) {
  const palette = statusPalette[status] ?? statusPalette.None;
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: palette.color }]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
