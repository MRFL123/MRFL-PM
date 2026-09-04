"use client";

import { useId, type MouseEvent, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const contentId = useId();
  const label = expanded ? `Collapse ${title}` : `Expand ${title}`;

  const onHeaderClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("button")) return;
    onToggle();
  };

  return (
    <section>
      <div
        className="flex min-w-0 cursor-pointer items-center justify-between gap-2"
        onClick={onHeaderClick}
      >
        <h2 className="text-base font-semibold">{title}</h2>
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
        <div className="min-h-0 overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  );
}
