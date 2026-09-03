"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeliveredItemForm } from "@/components/dashboard/delivered-item-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { sortDeliveredItems } from "@/lib/projects";
import { SAVE_ERROR_MESSAGE, useProjects } from "@/lib/store";
import type { DeliveredItem, DeliveredItemInput, Project } from "@/lib/types";

function DeliveredItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: DeliveredItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 py-2 ${isDragging ? "opacity-70" : ""}`}
    >
      <button
        type="button"
        className="mt-0.5 text-muted-foreground hover:text-foreground"
        aria-label="Reorder delivered item"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-0.5 inline-flex items-center gap-1 text-xs text-sky-700 hover:underline"
        >
          Open Link
          <ExternalLink className="size-3" />
        </a>
      </div>
      <div className="flex shrink-0 gap-0.5">
        <Button size="icon-xs" variant="ghost" aria-label="Edit delivered item" onClick={onEdit}>
          <Pencil />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Delete delivered item"
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

export function DeliveredItemsCard({ project }: { project: Project }) {
  const { addDeliveredItem, updateDeliveredItem, deleteDeliveredItem, moveDeliveredItem } =
    useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveredItem | null>(null);
  const [deleting, setDeleting] = useState<DeliveredItem | null>(null);
  const items = sortDeliveredItems(project.deliveredItems ?? []);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <Card className="h-full min-h-[18rem] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Delivered Items</h2>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-start">
            <p className="text-sm text-muted-foreground">No delivered items yet.</p>
            <Button className="mt-3" size="sm" variant="outline" onClick={openCreate}>
              + Add Delivered Item
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={async (event: DragEndEvent) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              try {
                await moveDeliveredItem(project.id, String(active.id), String(over.id));
              } catch (error) {
                toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
              }
            }}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <DeliveredItemRow
                    key={item.id}
                    item={item}
                    onEdit={() => {
                      setEditing(item);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleting(item)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <DeliveredItemForm
        open={formOpen}
        item={editing}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={async (input: DeliveredItemInput) => {
          try {
            if (editing) {
              await updateDeliveredItem(project.id, editing.id, input);
              toast.success("Delivered item saved.");
            } else {
              await addDeliveredItem(project.id, input);
              toast.success("Delivered item added.");
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
            throw error;
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remove delivered item"
        description="Are you sure you want to remove this delivered item?"
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteDeliveredItem(project.id, deleting.id);
            toast.success("Delivered item removed.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
          }
        }}
      />
    </Card>
  );
}
