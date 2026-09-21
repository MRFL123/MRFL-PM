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
import type { Invoice, InvoiceInput, InvoiceStatus } from "@/lib/invoices";
import {
  reorderDeliveredItems,
  reorderMilestones,
  sortDeliveredItems,
  sortMilestones,
  touchProject,
} from "@/lib/projects";
import { invoiceRepository, projectRepository } from "@/lib/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  DeliveredItemInput,
  Milestone,
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
  invoices: Invoice[];
  getProject: (id: string) => Project | undefined;
  getInvoice: (id: string) => Invoice | undefined;
  getInvoiceForMilestone: (milestoneId: string) => Invoice | undefined;
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
  createInvoice: (input: InvoiceInput) => Promise<Invoice>;
  updateInvoice: (id: string, input: Partial<InvoiceInput> & { status?: InvoiceStatus }) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<void>;
}

const ProjectStoreContext = createContext<ProjectStore | null>(null);

function requireProject(projects: Project[], id: string): Project {
  const project = projects.find((item) => item.id === id);
  if (!project) throw new Error("Project not found.");
  return project;
}

async function maybeCreateAutomaticInvoice(
  project: Project,
  previousStatus: Status | undefined,
  milestone: Pick<Milestone, "id" | "name" | "price" | "currency" | "status">,
): Promise<Invoice | null> {
  if (previousStatus === "Delivered") return null;
  if (milestone.status !== "Delivered") return null;
  return invoiceRepository.createAutomaticForDeliveredMilestone({
    projectId: project.id,
    projectClient: project.client,
    milestoneId: milestone.id,
    milestoneName: milestone.name,
    price: milestone.price,
    currency: milestone.currency,
  });
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { signedIn, ready: authReady } = useAuth();
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const projectsRef = useRef(projects);
  const invoicesRef = useRef(invoices);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    invoicesRef.current = invoices;
  }, [invoices]);

  const reload = useCallback(async () => {
    const [loadedProjects, loadedInvoices] = await Promise.all([
      projectRepository.list(),
      invoiceRepository.list().catch(() => [] as Invoice[]),
    ]);
    setProjects(loadedProjects);
    setInvoices(loadedInvoices);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!signedIn) {
      /* eslint-disable react-hooks/set-state-in-effect -- clear workspace when signed out */
      setProjects([]);
      setInvoices([]);
      setReady(true);
      setLoadError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    let cancelled = false;
    setReady(false);
    reload()
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unable to load projects.");
          setProjects([]);
          setInvoices([]);
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
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, schedule)
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

  const getInvoice = useCallback(
    (id: string) => invoices.find((invoice) => invoice.id === id),
    [invoices],
  );

  const getInvoiceForMilestone = useCallback(
    (milestoneId: string) =>
      invoices.find(
        (invoice) => invoice.milestoneId === milestoneId && invoice.source === "automatic",
      ),
    [invoices],
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
        setInvoices((current) =>
          current.map((invoice) =>
            invoice.projectId === id
              ? { ...invoice, projectId: null, projectName: "" }
              : invoice,
          ),
        );
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

        const invoice = await maybeCreateAutomaticInvoice(project, undefined, milestone);
        if (invoice) {
          setInvoices((current) => [invoice, ...current.filter((row) => row.id !== invoice.id)]);
        }
      });
    },
    [runSave],
  );

  const updateMilestone = useCallback(
    async (projectId: string, milestoneId: string, input: MilestoneInput) => {
      await runSave(async () => {
        const project = requireProject(projectsRef.current, projectId);
        const previous = project.milestones.find((m) => m.id === milestoneId);
        await projectRepository.updateMilestone(projectId, milestoneId, input);
        const nextMilestone = {
          id: milestoneId,
          name: input.name.trim(),
          description: (input.description ?? "").trim(),
          price: Number.isFinite(input.price) ? Number(input.price) : 0,
          currency: (input.currency || "EGP").trim() || "EGP",
          status: input.status,
          startDate: input.startDate,
          endDate: input.endDate,
          order: previous?.order ?? 0,
        };

        setProjects((current) =>
          current.map((row) => {
            if (row.id !== projectId) return row;
            return touchProject(row, {
              milestones: row.milestones.map((milestone) =>
                milestone.id === milestoneId ? { ...milestone, ...nextMilestone } : milestone,
              ),
            });
          }),
        );

        const invoice = await maybeCreateAutomaticInvoice(
          project,
          previous?.status,
          nextMilestone,
        );
        if (invoice) {
          setInvoices((current) => [invoice, ...current.filter((row) => row.id !== invoice.id)]);
        }
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
        setInvoices((current) =>
          current.map((invoice) =>
            invoice.milestoneId === milestoneId
              ? { ...invoice, milestoneId: null, milestoneName: "" }
              : invoice,
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

  const createInvoice = useCallback(
    async (input: InvoiceInput) => {
      return runSave(async () => {
        const invoice = await invoiceRepository.create(input, { source: "manual" });
        setInvoices((current) => [invoice, ...current.filter((row) => row.id !== invoice.id)]);
        return invoice;
      });
    },
    [runSave],
  );

  const updateInvoice = useCallback(
    async (id: string, input: Partial<InvoiceInput> & { status?: InvoiceStatus }) => {
      return runSave(async () => {
        const existing = invoicesRef.current.find((row) => row.id === id);
        if (!existing) throw new Error("Invoice not found.");

        const locked = existing.source === "automatic" || existing.status === "Issued" || existing.status === "Paid";
        const safeInput: Partial<InvoiceInput> & { status?: InvoiceStatus } = { ...input };
        if (locked) {
          // Restrict silent financial edits on Issued/automatic/Paid.
          delete safeInput.amount;
          delete safeInput.currency;
          if (existing.source === "automatic") {
            delete safeInput.milestoneId;
            delete safeInput.projectId;
          }
        }

        const updated = await invoiceRepository.update(id, safeInput);
        setInvoices((current) => current.map((row) => (row.id === id ? updated : row)));
        return updated;
      });
    },
    [runSave],
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      await runSave(async () => {
        await invoiceRepository.delete(id);
        setInvoices((current) => current.filter((row) => row.id !== id));
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
      invoices,
      getProject,
      getInvoice,
      getInvoiceForMilestone,
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
      createInvoice,
      updateInvoice,
      deleteInvoice,
    }),
    [
      ready,
      saveState,
      loadError,
      projects,
      invoices,
      getProject,
      getInvoice,
      getInvoiceForMilestone,
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
      createInvoice,
      updateInvoice,
      deleteInvoice,
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
