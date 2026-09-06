import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import { countByStatus } from "@/lib/projects";
import type { Milestone, Project, Status } from "@/lib/types";

export type DueTone = "overdue" | "soon" | "upcoming";

export type DueMilestone = {
  project: Project;
  milestone: Milestone;
  dueDate: Date;
  dueLabel: string;
  tone: DueTone;
};

export type OverviewStat = {
  key: string;
  label: string;
  value: number;
};

export function getOverviewStats(projects: Project[]): OverviewStat[] {
  const counts = countByStatus(projects);
  return [
    { key: "total", label: "Total Projects", value: projects.length },
    { key: "In Progress", label: "In Progress", value: counts["In Progress"] },
    { key: "Delay", label: "Delayed", value: counts.Delay },
    { key: "On Hold", label: "On Hold", value: counts["On Hold"] },
    { key: "Delivered", label: "Delivered", value: counts.Delivered },
  ];
}

function dueMeta(dueDate: Date, status: Status, today: Date): { label: string; tone: DueTone } {
  if (status === "Delay") return { label: "Overdue", tone: "overdue" };
  const diff = differenceInCalendarDays(dueDate, today);
  if (diff < 0) return { label: "Overdue", tone: "overdue" };
  if (diff === 0) return { label: "Due Today", tone: "soon" };
  if (diff === 1) return { label: "Due Tomorrow", tone: "soon" };
  return { label: "Upcoming", tone: "upcoming" };
}

export function getDueMilestones(
  projects: Project[],
  limit = 6,
  today = new Date(),
): DueMilestone[] {
  const rows: DueMilestone[] = [];

  for (const project of projects) {
    for (const milestone of project.milestones) {
      if (milestone.status === "Delivered") continue;
      if (!milestone.endDate) continue;
      const dueDate = parseISO(milestone.endDate);
      if (!isValid(dueDate)) continue;
      const { label, tone } = dueMeta(dueDate, milestone.status, today);
      rows.push({ project, milestone, dueDate, dueLabel: label, tone });
    }
  }

  rows.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  return rows.slice(0, limit);
}
