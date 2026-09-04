import { format, formatDistanceToNow, isValid, parseISO, startOfMonth, endOfMonth } from "date-fns";
import type { DateFilter, Project } from "@/lib/types";

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return "—";
  return format(parsed, "dd MMM yyyy");
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return "";
  return format(parsed, "d MMM");
}

export function toDateInputValue(value: string | null | undefined): string {
  return value ?? "";
}

export function fromDateInputValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isEndBeforeStart(
  startDate: string | null,
  endDate: string | null
): boolean {
  if (!startDate || !endDate) return false;
  return endDate < startDate;
}

export function formatLastUpdated(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return "—";
  return format(parsed, "d MMM");
}

export function formatRelativeUpdated(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return "—";
  return formatDistanceToNow(parsed, { addSuffix: true });
}

export function formatGeneratedDate(value = new Date()): string {
  return format(value, "d MMMM yyyy");
}

export function formatIsoDate(value = new Date()): string {
  return format(value, "yyyy-MM-dd");
}

export function matchesDateFilter(
  project: Project,
  filter: DateFilter,
  today = new Date()
): boolean {
  if (filter === "All") return true;

  const todayKey = format(today, "yyyy-MM-dd");
  const hasStart = Boolean(project.startDate);
  const hasEnd = Boolean(project.endDate);

  if (filter === "No dates") return !hasStart && !hasEnd;

  if (filter === "Upcoming") {
    return Boolean(project.startDate && project.startDate > todayKey);
  }

  if (filter === "Overdue") {
    return Boolean(
      project.endDate &&
        project.endDate < todayKey &&
        project.status !== "Delivered"
    );
  }

  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(today), "yyyy-MM-dd");
  const startInMonth = Boolean(
    project.startDate &&
      project.startDate >= monthStart &&
      project.startDate <= monthEnd
  );
  const endInMonth = Boolean(
    project.endDate && project.endDate >= monthStart && project.endDate <= monthEnd
  );
  return startInMonth || endInMonth;
}
