import { projectInitials } from "@/lib/projects";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-9 text-[11px]",
  md: "size-16 text-lg",
  lg: "size-20 text-xl",
} as const;

export function ProjectLogo({
  name,
  logo,
  size = "sm",
  className,
}: {
  name: string;
  logo: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground ring-1 ring-border",
        SIZES[size],
        className
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="size-full object-contain p-0.5" />
      ) : (
        <span className="font-semibold tracking-wide">{projectInitials(name)}</span>
      )}
    </div>
  );
}
