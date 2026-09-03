/* eslint-disable jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt */
import { Image, Link, Text, View } from "@react-pdf/renderer";
import { styles } from "@/components/pdf/styles";
import {
  isPdfSafeImage,
  isRichTextEmpty,
  parseRichText,
  type InlineMark,
} from "@/lib/rich-text";
import type { Project } from "@/lib/types";

function InlineText({ marks }: { marks: InlineMark[] }) {
  return (
    <Text>
      {marks.map((mark, index) => {
        const fontFamily =
          mark.bold && mark.italic
            ? "Helvetica-BoldOblique"
            : mark.bold
              ? "Helvetica-Bold"
              : mark.italic
                ? "Helvetica-Oblique"
                : "Helvetica";
        if (mark.href) {
          return (
            <Link
              key={`${mark.text}-${index}`}
              src={mark.href}
              style={{ fontFamily, color: "#0369A1" }}
            >
              {mark.text}
            </Link>
          );
        }
        return (
          <Text key={`${mark.text}-${index}`} style={{ fontFamily }}>
            {mark.text}
          </Text>
        );
      })}
    </Text>
  );
}

export function WeeklyUpdatesSection({ project }: { project: Project }) {
  const title = project.dashboard.card1.title.trim() || "Weekly Updates";
  const html = project.dashboard.card1.content;
  const empty = isRichTextEmpty(html);
  const blocks = empty ? [] : parseRichText(html);

  return (
    <View style={styles.card} wrap>
      <Text style={styles.cardTitle}>{title}</Text>
      {empty ? (
        <Text style={styles.empty}>No weekly updates available.</Text>
      ) : (
        blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <Text
                key={`h-${index}`}
                style={block.level === 2 ? styles.heading2 : styles.heading3}
              >
                <InlineText marks={block.children} />
              </Text>
            );
          }
          if (block.type === "paragraph") {
            return (
              <Text key={`p-${index}`} style={styles.paragraph}>
                <InlineText marks={block.children} />
              </Text>
            );
          }
          if (block.type === "list") {
            return (
              <View key={`l-${index}`} style={{ marginBottom: 4 }}>
                {block.items.map((item, itemIndex) => (
                  <View key={`li-${itemIndex}`} style={styles.listItem} wrap={false}>
                    <Text style={styles.listMark}>
                      {block.ordered ? `${itemIndex + 1}.` : "•"}
                    </Text>
                    <Text style={styles.listBody}>
                      <InlineText marks={item} />
                    </Text>
                  </View>
                ))}
              </View>
            );
          }
          if (block.type === "image" && isPdfSafeImage(block.src)) {
            return <Image key={`img-${index}`} src={block.src} style={styles.image} />;
          }
          return null;
        })
      )}
    </View>
  );
}
