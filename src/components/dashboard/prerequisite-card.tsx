"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
import { CollapsiblePanel } from "@/components/dashboard/collapsible-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createId } from "@/lib/ids";
import type { ChecklistItem, PrerequisiteCard as PrerequisiteCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

function ChecklistRow({
  item,
  editing,
  onPatch,
  onRemove,
}: {
  item: ChecklistItem;
  editing: boolean;
  onPatch: (patch: Partial<ChecklistItem>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start gap-2">
      <button
        type="button"
        disabled={!editing}
        onClick={() => onPatch({ completed: !item.completed })}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
          item.completed ? "bg-emerald-500 text-white" : "bg-red-500 text-white",
          editing && "cursor-pointer hover:opacity-80"
        )}
        aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
      >
        {item.completed ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </button>
      {editing ? (
        <>
          <Input
            value={item.text}
            onValueChange={(text) => onPatch({ text })}
            placeholder="Server"
            className="h-7"
          />
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            aria-label="Remove item"
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </>
      ) : (
        <span className="text-sm leading-6">{item.text || "Untitled item"}</span>
      )}
    </li>
  );
}

export function PrerequisiteCard({
  card,
  editing,
  expanded,
  onToggle,
  onChange,
}: {
  card: PrerequisiteCardData;
  editing: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChange: (updater: (current: PrerequisiteCardData) => PrerequisiteCardData) => void;
}) {
  const title = card.title.trim() || "Prerequisite (client)";

  const patchItem = (id: string, patch: Partial<ChecklistItem>) => {
    onChange((current) => ({
      ...current,
      checklistItems: current.checklistItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

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
                onValueChange={(nextTitle) =>
                  onChange((current) => ({ ...current, title: nextTitle }))
                }
                aria-label="Card title"
                className="h-8 font-medium"
              />
            ) : (
              <h2 className="text-base font-semibold">{title}</h2>
            )}
          </CardHeader>
        }
      >
        <CardContent className="pt-(--card-spacing)">
          {card.checklistItems.length === 0 && !editing ? (
            <p className="text-sm text-muted-foreground">No prerequisites added yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {card.checklistItems.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  editing={editing}
                  onPatch={(patch) => patchItem(item.id, patch)}
                  onRemove={() =>
                    onChange((current) => ({
                      ...current,
                      checklistItems: current.checklistItems.filter(
                        (entry) => entry.id !== item.id
                      ),
                    }))
                  }
                />
              ))}
            </ul>
          )}
          {editing && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() =>
                onChange((current) => ({
                  ...current,
                  checklistItems: [
                    ...current.checklistItems,
                    { id: createId(), text: "", completed: false, order: current.checklistItems.length },
                  ],
                }))
              }
            >
              <Plus data-icon="inline-start" />
              Add item
            </Button>
          )}
        </CardContent>
      </CollapsiblePanel>
    </Card>
  );
}
