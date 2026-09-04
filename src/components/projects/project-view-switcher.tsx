"use client";

import { LayoutGrid, List } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProjectListView = "list" | "card";

export function ProjectViewSwitcher({
  value,
  onChange,
}: {
  value: ProjectListView;
  onChange: (view: ProjectListView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Project view"
      className="inline-flex rounded-lg border border-border bg-muted/70 p-0.5"
    >
      <ViewButton
        pressed={value === "list"}
        onClick={() => onChange("list")}
        ariaLabel="Switch to list view"
        icon={<List />}
        label="List"
      />
      <ViewButton
        pressed={value === "card"}
        onClick={() => onChange("card")}
        ariaLabel="Switch to card view"
        icon={<LayoutGrid />}
        label="Cards"
      />
    </div>
  );
}

function ViewButton({
  pressed,
  onClick,
  ariaLabel,
  icon,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  ariaLabel: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "gap-1.5 px-2.5",
        pressed &&
          "bg-white text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:bg-white hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
