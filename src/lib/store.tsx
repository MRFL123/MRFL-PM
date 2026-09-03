"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/lib/auth-context";
import {
  reorderDeliveredItems,
  reorderMilestones,
  sortDeliveredItems,
  sortMilestones,
  touchProject,
} from "@/lib/projects";
import { projectRepository } from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  DeliveredItemInput,
  MilestoneInput,
  Project,
  ProjectDashboardData,
  ProjectInput,
  Status,
} from "@/lib/types";

export const SAVE_ERROR_MESSAGE = "Unable to save changes. Please try again.";

type SaveState = "idle" | "saving" | "saved" | "error";

interface ProjectStore {
  ready: boolean;
  saving: boolean;
  saveState: SaveState;
  loadError: string | null;
  projects: Project[];
  getProject: (id: string) => Project | undefined;
  reload: () => Promise<void>;
  addProject: (input: ProjectInput) => Promise<Project>;
  updateProject: (id: string, input: ProjectInput) => Promise<Project>;
  updateProjectStatus: (id: string, status: Status) => Promise<void>;
  updateProjectDates: (
    id: string,
    startDate: string | null,
    endDate: string | null
  ) => Promise<void>;
  updateDashboard: (id: string, dashboard: ProjectDashboardData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMilestone: (projectId: string, input: MilestoneInput) => Promise<void>;
  updateMilestone: (
    projectId: string,
    milestoneId: string,
    input: MilestoneInput
  ) => Promise<void>;
  deleteMilestone: (projectId: string, milestoneId: string) => Promise<void>;
  moveMilestone: (
    projectId: string,
    activeId: string,
    overId: string
  ) => Promise<void>;
  addDeliveredItem: (projectId: string, input: DeliveredItemInput) => Promise<void>;
  updateDeliveredItem: (
    projectId: string,
    itemId: string,
    input: DeliveredItemInput
  ) => Promise<void>;
  deleteDeliveredItem: (projectId: string, itemId: string) => Promise<void>;
  moveDeliveredItem: (
    projectId: string,
    activeId: string,
    overId: string
  ) => Promise<void>;
  importLegacyProjects: (projects: Project[]) => Promise<number>;
}

const ProjectStoreContext = createContext<ProjectStore | null>(null);

function requireProject(projects: Project[], id: string): Project {
  const project = projects.find((item) => item.id === id);
  if (!project) throw new Error("Project not found.");
  return project;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { signedIn, ready: authReady } = useAuth();
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const reload = useCallback(async () => {
    const loaded = await projectRepository.list();
    setProjects(loaded);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!signedIn) {
      setProjects([]);
      setReady(true);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setReady(false);
    reload()
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load projects.");
          setProjects([]);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, signedIn, reload]);

  useEffect(() => {
    if (!signedIn || !isSupabaseConfigured()) return;
    const supabase = createSupabaseBrowserClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel("pm-workspace")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_dashboard" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_prerequisites" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_milestones" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "project_delivered_items" }, schedule)
      .subscribe();

    function schedule() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void reload().catch(() => undefined);
      }, 400);
    }

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [signedIn, reload]);

  const runSave = useCallback(async <T,>(work: () => Promise<T>): Promise<T> => {
    setSaveState("saving");
    try {
      const result = await work();
      setSaveState("saved");
      return result;
    } catch (error) {
      setSaveState("error");
      throw error instanceof Error ? error : new Error(SAVE_ERROR_MESSAGE);
    }
  }, []);

  const getProject = useCallback(
    (id: string) => projects.find((project) => project.id === id),
    [projects],
  );

  const addProject = useCallback(
    async (input: ProjectInput) => {
      return runSave(async () => {
        const project = await projectRepository.create(input);
        setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
        return project;
      });
    },
    [runSave],
  );

  const updateProject = useCallback(
    async (id: string, input: ProjectInput) => {
      return runSave(async () => {
        const previous = requireProject(projectsRef.current, id);
        const updated = await projectRepository.update(id, input, previous.logo);
        setProjects((current) => current.map((item) => (item.id === id ? updated : item)));
        return updated;
      });
    },
    [runSave],
  );

  const updateProjectStatus = useCallback(
    async (id: string, status: Status) => {
      await runSave(async () => {
        const previous = projectsRef.current;
        setProjects((current) =>
          current.map((project) =>
            project.id === id ? touchProject(project, { status }) : project,
          ),
        );
        try {
          await projectRepository.updateStatus(id, status);
        } catch (error) {
          setProjects(previous);
          throw error;
        }
      });
    },
    [runSave],
  );

  const updateProjectDates = useCallback(
    async (id: string, startDate: string | null, endDate: string | null) => {
      await runSave(async () => {
        await projectRepository.updateDates(id, startDate, endDate);
        setProjects((current) =>
          current.map((project) =>
            project.id === id ? touchProject(project, { startDate, endDate }) : project,
          ),
        );
      });
    },
    [runSave],
  );

  const updateDashboard = useCallback(
    async (id: string, dashboard: ProjectDashboardData) => {
      await runSave(async () => {
        await projectRepository.updateDashboard(id, dashboard);
        setProjects((current) =>
          current.map((project) =>
            project.id === id ? touchProject(project, { dashboard }) : project,
          ),
        );
      });
    },
    [runSave],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await runSave(async () => {
        const previous = requireProject(projectsRef.current, id);
        await projectRepository.delete(id, previous.logo);
        setProjects((current) => current.filter((project) => project.id !== id));
      });
    },
    [runSave],
  );

  const addMilestone = useCallback(
    async (projectId: string, input: MilestoneInput) => {
      await runSave(async () => {
        const project = requireProject(projectsRef.current, projectId);
        const milestone = await projectRepository.addMilestone(
          projectId,
          input,
          project.milestones.length,
        );
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId
              ? touchProject(item, {
                  milestones: [...sortMilestones(item.milestones), milestone],
                })
              : item,
          ),
        );
      });
    },
    [runSave],
  );

  const updateMilestone = useCallback(
    async (projectId: string, milestoneId: string, input: MilestoneInput) => {
      await runSave(async () => {
        await projectRepository.updateMilestone(projectId, milestoneId, input);
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) return project;
            return touchProject(project, {
              milestones: project.milestones.map((milestone) =>
                milestone.id === milestoneId
                  ? {
                      ...milestone,
                      name: input.name.trim(),
                      status: input.status,
                      startDate: input.startDate,
                      endDate: input.endDate,
                    }
                  : milestone,
              ),
            });
          }),
        );
      });
    },
    [runSave],
  );

  const deleteMilestone = useCallback(
    async (projectId: string, milestoneId: string) => {
      await runSave(async () => {
        const project = requireProject(projectsRef.current, projectId);
        const remaining = sortMilestones(
          project.milestones.filter((milestone) => milestone.id !== milestoneId),
        ).map((milestone, index) => ({ ...milestone, order: index }));
        await projectRepository.deleteMilestone(projectId, milestoneId, remaining);
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId ? touchProject(item, { milestones: remaining }) : item,
          ),
        );
      });
    },
    [runSave],
  );

  const moveMilestone = useCallback(
    async (projectId: string, activeId: string, overId: string) => {
      await runSave(async () => {
        const project = requireProject(projectsRef.current, projectId);
        const ordered = reorderMilestones(project.milestones, activeId, overId);
        await projectRepository.reorderMilestones(projectId, ordered);
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId ? touchProject(item, { milestones: ordered }) : item,
          ),
        );
      });
    },
    [runSave],
  );

  const addDeliveredItem = useCallback(
    async (projectId: string, input: DeliveredItemInput) => {
      await runSave(async () => {
        const project = requireProject(projectsRef.current, projectId);
        const items = project.deliveredItems ?? [];
        const item = await projectRepository.addDeliveredItem(projectId, input, items.length);
        setProjects((current) =>
          current.map((row) =>
            row.id === projectId
              ? touchProject(row, {
                  deliveredItems: [...sortDeliveredItems(row.deliveredItems ?? []), item],
                })
              : row,
          ),
        );
      });
    },
    [runSave],
  );

  const updateDeliveredItem = useCallback(
    async (projectId: string, itemId: string, input: DeliveredItemInput) => {
      await runSave(async () => {
        await projectRepository.updateDeliveredItem(projectId, itemId, input);
        setProjects((current) =>
          current.map((project) => {
            if (project.id !== projectId) return project;
            return touchProject(project, {
              deliveredItems: (project.deliveredItems ?? []).map((item) =>
                item.id === itemId
                  ? { ...item, name: input.name.trim(), url: input.url.trim() }
                  : item,
              ),
            });
          }),
        );
      });
    },
    [runSave],
  );

  const deleteDeliveredItem = useCallback(
    async (projectId: string, itemId: string) => {
      await runSave(async () => {
        const project = requireProject(projectsRef.current, projectId);
        const remaining = sortDeliveredItems(
          (project.deliveredItems ?? []).filter((item) => item.id !== itemId),
        ).map((item, index) => ({ ...item, order: index }));
        await projectRepository.deleteDeliveredItem(projectId, itemId, remaining);
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId ? touchProject(item, { deliveredItems: remaining }) : item,
          ),
        );
      });
    },
    [runSave],
  );

  const moveDeliveredItem = useCallback(
    async (projectId: string, activeId: string, overId: string) => {
      await runSave(async () => {
        const project = requireProject(projectsRef.current, projectId);
        const ordered = reorderDeliveredItems(project.deliveredItems ?? [], activeId, overId);
        await projectRepository.reorderDeliveredItems(projectId, ordered);
        setProjects((current) =>
          current.map((item) =>
            item.id === projectId ? touchProject(item, { deliveredItems: ordered }) : item,
          ),
        );
      });
    },
    [runSave],
  );

  const importLegacyProjects = useCallback(
    async (legacy: Project[]) => {
      return runSave(async () => {
        const imported = await projectRepository.importProjects(legacy);
        setProjects((current) => [...imported, ...current]);
        return imported.length;
      });
    },
    [runSave],
  );

  const value = useMemo<ProjectStore>(
    () => ({
      ready,
      saving: saveState === "saving",
      saveState,
      loadError,
      projects,
      getProject,
      reload,
      addProject,
      updateProject,
      updateProjectStatus,
      updateProjectDates,
      updateDashboard,
      deleteProject,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      moveMilestone,
      addDeliveredItem,
      updateDeliveredItem,
      deleteDeliveredItem,
      moveDeliveredItem,
      importLegacyProjects,
    }),
    [
      ready,
      saveState,
      loadError,
      projects,
      getProject,
      reload,
      addProject,
      updateProject,
      updateProjectStatus,
      updateProjectDates,
      updateDashboard,
      deleteProject,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      moveMilestone,
      addDeliveredItem,
      updateDeliveredItem,
      deleteDeliveredItem,
      moveDeliveredItem,
      importLegacyProjects,
    ],
  );

  return (
    <ProjectStoreContext.Provider value={value}>{children}</ProjectStoreContext.Provider>
  );
}

export function useProjects() {
  const store = useContext(ProjectStoreContext);
  if (!store) {
    throw new Error("useProjects must be used within ProjectProvider.");
  }
  return store;
}
