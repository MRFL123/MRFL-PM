"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { StatusSelect } from "@/components/status-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDisplayDate, fromDateInputValue, isEndBeforeStart } from "@/lib/dates";
import type { Milestone, Status } from "@/lib/types";

export function MilestoneRow({
  milestone,
  onStatusChange,
  onDatesChange,
  onEdit,
  onDelete,
}: {
  milestone: Milestone;
  onStatusChange: (status: Status) => void;
  onDatesChange: (startDate: string | null, endDate: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: milestone.id });

  const commitDates = (startDate: string | null, endDate: string | null) => {
    if (isEndBeforeStart(startDate, endDate)) return;
    if (startDate === milestone.startDate && endDate === milestone.endDate) return;
    onDatesChange(startDate, endDate);
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "bg-muted/70 opacity-80" : undefined}
    >
      <TableCell className="min-w-[16rem]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Reorder milestone"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <span className="font-medium whitespace-normal">{milestone.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <StatusSelect compact value={milestone.status} onChange={onStatusChange} />
      </TableCell>
      <TableCell>
        <Input
          type="date"
          aria-label={`${milestone.name} start date`}
          value={milestone.startDate ?? ""}
          className="h-7 w-[10.5rem]"
          onChange={(event) =>
            commitDates(fromDateInputValue(event.target.value), milestone.endDate)
          }
        />
        <span className="sr-only">{formatDisplayDate(milestone.startDate)}</span>
      </TableCell>
      <TableCell>
        <Input
          type="date"
          aria-label={`${milestone.name} end date`}
          value={milestone.endDate ?? ""}
          className="h-7 w-[10.5rem]"
          onChange={(event) =>
            commitDates(milestone.startDate, fromDateInputValue(event.target.value))
          }
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button size="icon-sm" variant="ghost" aria-label="Edit milestone" onClick={onEdit}>
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Delete milestone"
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
