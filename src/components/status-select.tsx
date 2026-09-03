"use client";

import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUSES, type Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusSelect({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: Status;
  onChange: (status: Status) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as Status);
      }}
    >
      <SelectTrigger
        size={compact ? "sm" : "default"}
        className={cn(compact && "h-7 min-w-[8.5rem] border-transparent bg-transparent px-1", className)}
      >
        <SelectValue>
          <StatusBadge status={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <StatusBadge status={status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
