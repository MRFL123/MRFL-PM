export function ProjectProgress({
  value,
  barClassName = "w-14",
}: {
  value: number;
  barClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 overflow-hidden rounded-full bg-zinc-100 ${barClassName}`}>
        <div
          className="h-full rounded-full bg-sky-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}
