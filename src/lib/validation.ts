import { isEndBeforeStart } from "@/lib/dates";
import type { ProjectInput, Status } from "@/lib/types";
import { PROJECT_TYPES, STATUSES } from "@/lib/types";

export interface NamedDateFields {
  name: string;
  startDate: string | null;
  endDate: string | null;
}

export function validateNamedDates(
  fields: NamedDateFields,
  nameLabel: string
): string | null {
  if (!fields.name.trim()) {
    return `${nameLabel} is required.`;
  }
  if (isEndBeforeStart(fields.startDate, fields.endDate)) {
    return "End date cannot be before start date.";
  }
  return null;
}

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

export function validateProjectInput(input: ProjectInput): string | null {
  const named = validateNamedDates(input, "Project name");
  if (named) return named;
  if (!(PROJECT_TYPES as readonly string[]).includes(input.type)) {
    return "Project type is required.";
  }
  return null;
}
