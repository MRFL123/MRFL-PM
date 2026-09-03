import { createEmptyDashboard, isProjectType } from "@/lib/projects";
import type { Project, ProjectDashboardData, Status } from "@/lib/types";
import { STATUSES } from "@/lib/types";

export const LEGACY_PROJECTS_KEY = "pm-dashboard:projects:v1";
export const LEGACY_AUTH_KEY = "pm-dashboard:auth:v1";
export const LEGACY_MIGRATION_FLAG = "pm-dashboard:migrated-to-supabase";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

function normalizeDashboard(raw: unknown, projectName: string): ProjectDashboardData {
  const fallback = createEmptyDashboard(projectName);
  if (!raw || typeof raw !== "object") return fallback;
  const dashboard = raw as Record<string, unknown>;
  const card1 = dashboard.card1 as Record<string, unknown> | undefined;
  const card2 = dashboard.card2 as Record<string, unknown> | undefined;
  const card3 = dashboard.card3 as Record<string, unknown> | undefined;

  return {
    card1: {
      title: typeof card1?.title === "string" ? card1.title : fallback.card1.title,
      content: typeof card1?.content === "string" ? card1.content : fallback.card1.content,
    },
    card2: {
      title: typeof card2?.title === "string" ? card2.title : fallback.card2.title,
      checklistItems: Array.isArray(card2?.checklistItems)
        ? (card2.checklistItems as ProjectDashboardData["card2"]["checklistItems"]).map(
            (item, index) => ({
              id: item.id,
              text: item.text ?? "",
              completed: Boolean(item.completed),
              order: typeof item.order === "number" ? item.order : index,
            }),
          )
        : fallback.card2.checklistItems,
    },
    card3: {
      title: typeof card3?.title === "string" ? card3.title : fallback.card3.title,
      subtitle: typeof card3?.subtitle === "string" ? card3.subtitle : fallback.card3.subtitle,
    },
  };
}

function migrateLogo(raw: Record<string, unknown>): string | null {
  if (typeof raw.logo === "string" && raw.logo.length > 0) return raw.logo;
  const dashboard = raw.dashboard as Record<string, unknown> | undefined;
  const card3 = dashboard?.card3 as Record<string, unknown> | undefined;
  if (typeof card3?.image === "string" && card3.image.length > 0) return card3.image;
  return null;
}

function normalizeProject(raw: unknown): Project | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;

  const name = value.name;
  return {
    id: value.id,
    name,
    client: typeof value.client === "string" ? value.client : "",
    owner: typeof value.owner === "string" ? value.owner : "",
    type: isProjectType(String(value.type ?? "")) ? (value.type as Project["type"]) : "Website",
    logo: migrateLogo(value),
    description: typeof value.description === "string" ? value.description : "",
    status: isStatus(value.status) ? value.status : "None",
    startDate: typeof value.startDate === "string" ? value.startDate : null,
    endDate: typeof value.endDate === "string" ? value.endDate : null,
    dashboard: normalizeDashboard(value.dashboard, name),
    deliveredItems: Array.isArray(value.deliveredItems)
      ? (value.deliveredItems as Project["deliveredItems"])
      : [],
    milestones: Array.isArray(value.milestones) ? (value.milestones as Project["milestones"]) : [],
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : new Date().toISOString(),
  };
}

export function readLegacyProjects(): Project[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(LEGACY_PROJECTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeProject(item))
      .filter((item): item is Project => item !== null);
  } catch {
    return [];
  }
}

export function hasPendingLegacyMigration(): boolean {
  if (!canUseStorage()) return false;
  if (window.localStorage.getItem(LEGACY_MIGRATION_FLAG) === "1") return false;
  return readLegacyProjects().length > 0;
}

export function markLegacyMigrationComplete() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LEGACY_MIGRATION_FLAG, "1");
}

export function clearLegacyAuthFlag() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(LEGACY_AUTH_KEY);
}
