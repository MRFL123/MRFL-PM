import { createEmptyDashboard, isProjectType } from "@/lib/projects";
import {
  INVOICE_SOURCES,
  INVOICE_STATUSES,
  type Invoice,
  type InvoiceSource,
  type InvoiceStatus,
} from "@/lib/invoices";
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
  description: string | null;
  price: number | string | null;
  currency: string | null;
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

export type InvoiceRow = {
  id: string;
  number: string;
  invoice_date: string;
  client: string | null;
  project_id: string | null;
  milestone_id: string | null;
  description: string | null;
  amount: number | string | null;
  currency: string | null;
  status: string;
  payment_number: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string } | { id: string; name: string }[] | null;
  project_milestones?: { id: string; name: string } | { id: string; name: string }[] | null;
};

function asStatus(value: unknown): Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value)
    ? (value as Status)
    : "None";
}

function asInvoiceStatus(value: unknown): InvoiceStatus {
  if (value === "Sent") return "Issued";
  return typeof value === "string" && (INVOICE_STATUSES as readonly string[]).includes(value)
    ? (value as InvoiceStatus)
    : "Draft";
}

function asInvoiceSource(value: unknown): InvoiceSource {
  return typeof value === "string" && (INVOICE_SOURCES as readonly string[]).includes(value)
    ? (value as InvoiceSource)
    : "manual";
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function asNumber(value: number | string | null | undefined, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function mapMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: asNumber(row.price),
    currency: row.currency || "EGP",
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

export function mapInvoice(row: InvoiceRow): Invoice {
  const project = one(row.projects);
  const milestone = one(row.project_milestones);
  return {
    id: row.id,
    number: row.number,
    invoiceDate: row.invoice_date,
    client: row.client ?? "",
    projectId: row.project_id,
    projectName: project?.name ?? "",
    milestoneId: row.milestone_id,
    milestoneName: milestone?.name ?? "",
    description: row.description ?? "",
    amount: asNumber(row.amount),
    currency: row.currency || "EGP",
    status: asInvoiceStatus(row.status),
    paymentNumber: row.payment_number ?? "",
    source: asInvoiceSource(row.source),
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

export const INVOICE_SELECT = `
  *,
  projects ( id, name ),
  project_milestones ( id, name )
`;
