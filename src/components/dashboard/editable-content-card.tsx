"use client";

import { RichTextEditor, RichTextView } from "@/components/rich-text-editor";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { WeeklyUpdatesCard } from "@/lib/types";

export function EditableContentCard({
  card,
  editing,
  onChange,
}: {
  card: WeeklyUpdatesCard;
  editing: boolean;
  onChange: (card: WeeklyUpdatesCard) => void;
}) {
  return (
    <Card className="h-full min-h-[18rem] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader className="border-b">
        {editing ? (
          <Input
            value={card.title}
            onChange={(event) => onChange({ ...card, title: event.target.value })}
            aria-label="Card title"
            className="h-8 font-medium"
          />
        ) : (
          <h2 className="text-base font-semibold">{card.title || "Weekly Updates"}</h2>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
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
    </Card>
  );
}
