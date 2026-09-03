"use client";

import { useId, type MouseEvent, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isHeaderIgnored(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "input, textarea, select, a, button, [contenteditable='true'], [data-collapse-ignore]"
      )
    )
  );
}

export function CollapsiblePanel({
  title,
  expanded,
  onToggle,
  headerStart,
  headerEnd,
  children,
  className,
  headerClassName,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  headerStart: ReactNode;
  headerEnd?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  const contentId = useId();
  const label = expanded ? `Collapse ${title}` : `Expand ${title}`;

  const onHeaderClick = (event: MouseEvent<HTMLDivElement>) => {
    if (isHeaderIgnored(event.target)) return;
    onToggle();
  };

  return (
    <div className={className}>
      <div
        className={cn("flex min-w-0 cursor-pointer items-center gap-2", headerClassName)}
        onClick={onHeaderClick}
      >
        <div className="min-w-0 flex-1">{headerStart}</div>
        {headerEnd ? <div data-collapse-ignore className="shrink-0">{headerEnd}</div> : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground"
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={label}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
        >
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>
      <div
        id={contentId}
        role="region"
        aria-label={title}
        aria-hidden={!expanded}
        inert={!expanded}
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
