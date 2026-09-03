import { createEmptyDashboard, isProjectType } from "@/lib/projects";
import type {
  ChecklistItem,
  DeliveredItem,
  Milestone,
  Project,
  Status,
} from "@/lib/types";
import { STATUSES } from "@/lib/types";

export type ProjectRow = {
  id: string;
  name: string;
  client: string | null;
  owner: string | null;
  type: string;
  logo_url: string | null;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardRow = {
  project_id: string;
  weekly_title: string | null;
  weekly_content: string | null;
  prerequisites_title: string | null;
  cover_title: string | null;
  cover_subtitle: string | null;
};

export type PrerequisiteRow = {
  id: string;
  project_id: string;
  text: string | null;
  completed: boolean | null;
  sort_order: number | null;
};

export type MilestoneRow = {
  id: string;
  project_id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  sort_order: number | null;
};

export type DeliveredRow = {
  id: string;
  project_id: string;
  name: string;
  url: string;
  sort_order: number | null;
};

export type ProjectQueryRow = ProjectRow & {
  project_dashboard: DashboardRow | DashboardRow[] | null;
  project_prerequisites: PrerequisiteRow[] | null;
  project_milestones: MilestoneRow[] | null;
  project_delivered_items: DeliveredRow[] | null;
};

function asStatus(value: unknown): Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value)
    ? (value as Status)
    : "None";
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function mapMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    name: row.name,
    status: asStatus(row.status),
    startDate: row.start_date,
    endDate: row.end_date,
    order: row.sort_order ?? 0,
  };
}

export function mapDeliveredItem(row: DeliveredRow): DeliveredItem {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    order: row.sort_order ?? 0,
  };
}

export function mapPrerequisite(row: PrerequisiteRow): ChecklistItem {
  return {
    id: row.id,
    text: row.text ?? "",
    completed: Boolean(row.completed),
    order: row.sort_order ?? 0,
  };
}

export function mapProject(row: ProjectQueryRow): Project {
  const dashboard = one(row.project_dashboard);
  const fallback = createEmptyDashboard(row.name);
  const prerequisites = [...(row.project_prerequisites ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapPrerequisite);
  const milestones = [...(row.project_milestones ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapMilestone);
  const deliveredItems = [...(row.project_delivered_items ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapDeliveredItem);

  return {
    id: row.id,
    name: row.name,
    client: row.client ?? "",
    owner: row.owner ?? "",
    type: isProjectType(row.type) ? row.type : "Website",
    logo: row.logo_url,
    description: row.description ?? "",
    status: asStatus(row.status),
    startDate: row.start_date,
    endDate: row.end_date,
    dashboard: {
      card1: {
        title: dashboard?.weekly_title || fallback.card1.title,
        content: dashboard?.weekly_content ?? "",
      },
      card2: {
        title: dashboard?.prerequisites_title || fallback.card2.title,
        checklistItems: prerequisites,
      },
      card3: {
        title: dashboard?.cover_title || row.name,
        subtitle: dashboard?.cover_subtitle || fallback.card3.subtitle,
      },
    },
    deliveredItems,
    milestones,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const PROJECT_SELECT = `
  *,
  project_dashboard (*),
  project_prerequisites (*),
  project_milestones (*),
  project_delivered_items (*)
`;
