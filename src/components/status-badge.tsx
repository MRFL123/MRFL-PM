import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/types";

export function StatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] ring-1 ring-inset",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
