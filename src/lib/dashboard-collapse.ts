"use client";

import { useMemo } from "react";
import { useUiPreference } from "@/lib/ui-preferences";

export const DASHBOARD_SECTION_IDS = [
  "weeklyUpdates",
  "prerequisites",
  "deliveredItems",
  "progress",
] as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTION_IDS)[number];

export type DashboardCollapseState = Record<DashboardSectionId, boolean>;

const DEFAULT_STATE: DashboardCollapseState = {
  weeklyUpdates: true,
  prerequisites: true,
  deliveredItems: true,
  progress: true,
};

function storageKey(projectId: string) {
  return `mrfl-pm.dashboard-collapse.${projectId}`;
}

function parseState(raw: string): DashboardCollapseState {
  try {
    const parsed = JSON.parse(raw) as Partial<DashboardCollapseState>;
    return {
      weeklyUpdates: parsed.weeklyUpdates ?? true,
      prerequisites: parsed.prerequisites ?? true,
      deliveredItems: parsed.deliveredItems ?? true,
      progress: parsed.progress ?? true,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useDashboardCollapse(projectId: string) {
  const [raw, setRaw] = useUiPreference(
    storageKey(projectId),
    JSON.stringify(DEFAULT_STATE)
  );

  return useMemo(() => {
    const expanded = parseState(raw);

    const write = (next: DashboardCollapseState) => {
      setRaw(JSON.stringify(next));
    };

    return {
      expanded,
      toggle: (id: DashboardSectionId) => {
        write({ ...expanded, [id]: !expanded[id] });
      },
      setSection: (id: DashboardSectionId, open: boolean) => {
        write({ ...expanded, [id]: open });
      },
      expandAll: () => {
        write({
          weeklyUpdates: true,
          prerequisites: true,
          deliveredItems: true,
          progress: true,
        });
      },
      collapseAll: () => {
        write({
          weeklyUpdates: false,
          prerequisites: false,
          deliveredItems: false,
          progress: false,
        });
      },
    };
  }, [raw, setRaw]);
}
