"use client";

import { CollapsiblePanel } from "@/components/dashboard/collapsible-panel";
import { RichTextEditor, RichTextView } from "@/components/rich-text-editor";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { WeeklyUpdatesCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EditableContentCard({
  card,
  editing,
  expanded,
  onToggle,
  onChange,
}: {
  card: WeeklyUpdatesCard;
  editing: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChange: (card: WeeklyUpdatesCard) => void;
}) {
  const title = card.title.trim() || "Weekly Updates";

  return (
    <Card
      className={cn(
        "bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        expanded && "h-full min-h-[18rem]"
      )}
    >
      <CollapsiblePanel
        title={title}
        expanded={expanded}
        onToggle={onToggle}
        headerClassName={cn("px-(--card-spacing)", expanded && "border-b pb-(--card-spacing)")}
        headerStart={
          <CardHeader className="px-0">
            {editing ? (
              <Input
                value={card.title}
                onChange={(event) => onChange({ ...card, title: event.target.value })}
                aria-label="Card title"
                className="h-8 font-medium"
              />
            ) : (
              <h2 className="text-base font-semibold">{title}</h2>
            )}
          </CardHeader>
        }
      >
        <CardContent className="flex flex-1 flex-col pt-(--card-spacing)">
          {editing ? (
            <RichTextEditor
              content={card.content}
              editable
              onChange={(content) => onChange({ ...card, content })}
            />
          ) : (
            <RichTextView html={card.content} />
          )}
        </CardContent>
      </CollapsiblePanel>
    </Card>
  );
}
