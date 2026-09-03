import type { Status } from "@/lib/types";

export const STATUS_LABELS: Record<Status, string> = {
  None: "NONE",
  "On Hold": "ON HOLD",
  "In Progress": "IN PROGRESS",
  Delivered: "DELIVERED",
  Delay: "DELAY",
};

export const STATUS_STYLES: Record<Status, string> = {
  None: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  "On Hold": "bg-orange-50 text-orange-700 ring-orange-200",
  "In Progress": "bg-sky-50 text-sky-700 ring-sky-200",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Delay: "bg-red-50 text-red-700 ring-red-200",
};

export const STATUS_DOT: Record<Status, string> = {
  None: "bg-zinc-400",
  "On Hold": "bg-orange-500",
  "In Progress": "bg-sky-500",
  Delivered: "bg-emerald-500",
  Delay: "bg-red-500",
};

export const SUMMARY_STATUS_KEYS = [
  "In Progress",
  "Delivered",
  "Delay",
  "On Hold",
] as const satisfies readonly Status[];
