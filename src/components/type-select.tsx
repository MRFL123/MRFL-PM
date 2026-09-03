"use client";

import { TypeBadge } from "@/components/type-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_TYPES, type ProjectType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TypeSelect({
  value,
  onChange,
  className,
}: {
  value: ProjectType;
  onChange: (type: ProjectType) => void;
  className?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as ProjectType);
      }}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue>
          <TypeBadge type={value} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        {PROJECT_TYPES.map((type) => (
          <SelectItem key={type} value={type}>
            <TypeBadge type={type} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
