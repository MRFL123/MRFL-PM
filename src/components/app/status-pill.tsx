import { cn } from "@/lib/utils";

export function StatusPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        className,
      )}
    >
      {label}
    </span>
  );
}
