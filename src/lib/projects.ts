import { createId } from "@/lib/ids";
import type {
  DeliveredItem,
  DeliveredItemInput,
  Milestone,
  MilestoneInput,
  Project,
  ProjectDashboardData,
  ProjectInput,
  ProjectType,
  Status,
} from "@/lib/types";
import { PROJECT_TYPES } from "@/lib/types";

export function createEmptyDashboard(projectName: string): ProjectDashboardData {
  return {
    card1: {
      title: "Weekly Updates",
      content: "",
    },
    card2: {
      title: "Prerequisite (client)",
      checklistItems: [],
    },
    card3: {
      title: projectName,
      subtitle: "WEEKLY REPORT",
    },
  };
}

export function createProject(input: ProjectInput): Project {
  const now = new Date().toISOString();
  const name = input.name.trim();
  return {
    id: createId(),
    name,
    client: input.client.trim(),
    owner: input.owner.trim(),
    type: input.type,
    logo: input.logo,
    description: input.description.trim(),
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    dashboard: createEmptyDashboard(name),
    deliveredItems: [],
    milestones: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createDeliveredItem(
  input: DeliveredItemInput,
  order: number
): DeliveredItem {
  return {
    id: createId(),
    name: input.name.trim(),
    url: input.url.trim(),
    order,
  };
}

export function createMilestone(
  input: MilestoneInput,
  order: number
): Milestone {
  return {
    id: createId(),
    name: input.name.trim(),
    status: input.status,
    startDate: input.startDate,
    endDate: input.endDate,
    order,
  };
}

export function touchProject(project: Project, patch: Partial<Project>): Project {
  return {
    ...project,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function sortMilestones(milestones: Milestone[]): Milestone[] {
  return sortByOrder(milestones);
}

export function sortDeliveredItems(items: DeliveredItem[]): DeliveredItem[] {
  return sortByOrder(items);
}

export function reorderById<T extends { id: string; order: number }>(
  items: T[],
  activeId: string,
  overId: string
): T[] {
  const ordered = sortByOrder(items);
  const from = ordered.findIndex((item) => item.id === activeId);
  const to = ordered.findIndex((item) => item.id === overId);
  if (from < 0 || to < 0 || from === to) return items;

  const next = [...ordered];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((item, index) => ({ ...item, order: index }));
}

export function reorderMilestones(
  milestones: Milestone[],
  activeId: string,
  overId: string
): Milestone[] {
  return reorderById(milestones, activeId, overId);
}

export function reorderDeliveredItems(
  items: DeliveredItem[],
  activeId: string,
  overId: string
): DeliveredItem[] {
  return reorderById(items, activeId, overId);
}

export function countByStatus(projects: Project[]): Record<Status, number> {
  return projects.reduce(
    (counts, project) => {
      counts[project.status] += 1;
      return counts;
    },
    {
      None: 0,
      "On Hold": 0,
      "In Progress": 0,
      Delivered: 0,
      Delay: 0,
    } satisfies Record<Status, number>
  );
}

export function countByType(projects: Project[]): Record<ProjectType, number> {
  return projects.reduce(
    (counts, project) => {
      counts[project.type] += 1;
      return counts;
    },
    {
      Website: 0,
      Mobapp: 0,
      Webapp: 0,
      "UXUI Design": 0,
      Branding: 0,
    } satisfies Record<ProjectType, number>
  );
}

export function projectProgress(project: Project): number {
  if (project.milestones.length === 0) return 0;
  const delivered = project.milestones.filter(
    (milestone) => milestone.status === "Delivered"
  ).length;
  return Math.round((delivered / project.milestones.length) * 100);
}

export function nextMilestoneLabel(project: Project): string {
  if (project.milestones.length === 0) return "—";
  const next = sortMilestones(project.milestones).find(
    (milestone) => milestone.status !== "Delivered"
  );
  return next?.name ?? "Completed";
}

export function uniqueFieldValues(
  projects: Project[],
  field: "owner" | "client"
): string[] {
  const values = new Set<string>();
  for (const project of projects) {
    const value = (project[field] ?? "").trim();
    if (value) values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b));
}

export function projectInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  const caps = name.replace(/[^A-Z]/g, "");
  if (caps.length >= 2) return caps.slice(0, 2);
  return (name.trim().slice(0, 2) || "?").toUpperCase();
}

export function isProjectType(value: string): value is ProjectType {
  return (PROJECT_TYPES as readonly string[]).includes(value);
}

export function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "—";
}
