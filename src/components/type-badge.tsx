import { TYPE_LABELS, TYPE_STYLES } from "@/lib/project-type";
import { cn } from "@/lib/utils";
import type { ProjectType } from "@/lib/types";

export function TypeBadge({
  type,
  className,
}: {
  type: ProjectType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] ring-1 ring-inset",
        TYPE_STYLES[type],
        className
      )}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}
