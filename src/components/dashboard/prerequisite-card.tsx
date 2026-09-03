"use client";

import { Check, Plus, Trash2, X } from "lucide-react";
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
  onChange,
}: {
  card: PrerequisiteCardData;
  editing: boolean;
  onChange: (updater: (current: PrerequisiteCardData) => PrerequisiteCardData) => void;
}) {
  const patchItem = (id: string, patch: Partial<ChecklistItem>) => {
    onChange((current) => ({
      ...current,
      checklistItems: current.checklistItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  return (
    <Card className="h-full min-h-[18rem] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader className="border-b">
        {editing ? (
          <Input
            value={card.title}
            onValueChange={(title) => onChange((current) => ({ ...current, title }))}
            aria-label="Card title"
            className="h-8 font-medium"
          />
        ) : (
          <h2 className="text-base font-semibold">
            {card.title || "Prerequisite (client)"}
          </h2>
        )}
      </CardHeader>
      <CardContent>
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
    </Card>
  );
}
