import type {
  DeliveredItem,
  DeliveredItemInput,
  Milestone,
  MilestoneInput,
  Project,
  ProjectDashboardData,
  ProjectInput,
  Status,
} from "@/lib/types";
import { createDeliveredItem, createMilestone, createProject } from "@/lib/projects";
import { removeProjectAsset, uploadLogoValue } from "@/lib/storage/assets";
import { mapProject, PROJECT_SELECT, type ProjectQueryRow } from "@/lib/storage/mappers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const SAVE_ERROR = "Unable to save changes. Please try again.";

function throwSaveError(error: { message?: string } | null, fallback = SAVE_ERROR): never {
  throw new Error(error?.message || fallback);
}

async function fetchProject(id: string): Promise<Project> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", id)
    .single();
  if (error || !data) throwSaveError(error, "Project not found.");
  return mapProject(data as ProjectQueryRow);
}

async function fetchProjects(): Promise<Project[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("updated_at", { ascending: false });
  if (error) throwSaveError(error, "Unable to load projects. Please try again.");
  return (data as ProjectQueryRow[] | null)?.map(mapProject) ?? [];
}

async function replacePrerequisites(projectId: string, dashboard: ProjectDashboardData) {
  const supabase = createSupabaseBrowserClient();
  const { error: deleteError } = await supabase
    .from("project_prerequisites")
    .delete()
    .eq("project_id", projectId);
  if (deleteError) throwSaveError(deleteError);

  const rows = dashboard.card2.checklistItems.map((item, index) => ({
    id: item.id,
    project_id: projectId,
    text: item.text,
    completed: item.completed,
    sort_order: item.order ?? index,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from("project_prerequisites").insert(rows);
  if (error) throwSaveError(error);
}

export const supabaseProjectRepository = {
  async list() {
    return fetchProjects();
  },

  async get(id: string) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throwSaveError(error, "Unable to load project. Please try again.");
    return data ? mapProject(data as ProjectQueryRow) : null;
  },

  async create(input: ProjectInput) {
    const supabase = createSupabaseBrowserClient();
    const project = createProject(input);
    const logoUrl = await uploadLogoValue(input.logo);

    const { error: projectError } = await supabase.from("projects").insert({
      id: project.id,
      name: project.name,
      client: project.client,
      owner: project.owner,
      type: project.type,
      logo_url: logoUrl,
      description: project.description,
      status: project.status,
      start_date: project.startDate,
      end_date: project.endDate,
    });
    if (projectError) {
      if (logoUrl && logoUrl !== input.logo) await removeProjectAsset(logoUrl);
      throwSaveError(projectError);
    }

    const { error: dashboardError } = await supabase.from("project_dashboard").insert({
      project_id: project.id,
      weekly_title: project.dashboard.card1.title,
      weekly_content: project.dashboard.card1.content,
      prerequisites_title: project.dashboard.card2.title,
      cover_title: project.name,
      cover_subtitle: project.dashboard.card3.subtitle,
    });
    if (dashboardError) throwSaveError(dashboardError);

    return fetchProject(project.id);
  },

  async update(id: string, input: ProjectInput, previousLogo: string | null) {
    const supabase = createSupabaseBrowserClient();
    const logoUrl = await uploadLogoValue(input.logo);
    const { error } = await supabase
      .from("projects")
      .update({
        name: input.name.trim(),
        client: input.client.trim(),
        owner: input.owner.trim(),
        type: input.type,
        logo_url: logoUrl,
        description: input.description.trim(),
        status: input.status,
        start_date: input.startDate,
        end_date: input.endDate,
      })
      .eq("id", id);
    if (error) throwSaveError(error);

    await supabase
      .from("project_dashboard")
      .update({ cover_title: input.name.trim() })
      .eq("project_id", id);

    if (previousLogo && previousLogo !== logoUrl) {
      await removeProjectAsset(previousLogo);
    }

    return fetchProject(id);
  },

  async updateStatus(id: string, status: Status) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("projects").update({ status }).eq("id", id);
    if (error) throwSaveError(error);
  },

  async updateDates(id: string, startDate: string | null, endDate: string | null) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("projects")
      .update({ start_date: startDate, end_date: endDate })
      .eq("id", id);
    if (error) throwSaveError(error);
  },

  async updateDashboard(id: string, dashboard: ProjectDashboardData) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("project_dashboard")
      .upsert({
        project_id: id,
        weekly_title: dashboard.card1.title,
        weekly_content: dashboard.card1.content,
        prerequisites_title: dashboard.card2.title,
        cover_title: dashboard.card3.title,
        cover_subtitle: dashboard.card3.subtitle,
      });
    if (error) throwSaveError(error);
    await replacePrerequisites(id, dashboard);
    await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
  },

  async delete(id: string, logoUrl: string | null) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throwSaveError(error);
    await removeProjectAsset(logoUrl);
  },

  async addMilestone(projectId: string, input: MilestoneInput, order: number) {
    const supabase = createSupabaseBrowserClient();
    const milestone = createMilestone(input, order);
    const { error } = await supabase.from("project_milestones").insert({
      id: milestone.id,
      project_id: projectId,
      name: milestone.name,
      status: milestone.status,
      start_date: milestone.startDate,
      end_date: milestone.endDate,
      sort_order: milestone.order,
    });
    if (error) throwSaveError(error);
    return milestone;
  },

  async updateMilestone(projectId: string, milestoneId: string, input: MilestoneInput) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("project_milestones")
      .update({
        name: input.name.trim(),
        status: input.status,
        start_date: input.startDate,
        end_date: input.endDate,
      })
      .eq("id", milestoneId)
      .eq("project_id", projectId);
    if (error) throwSaveError(error);
  },

  async deleteMilestone(projectId: string, milestoneId: string, remaining: Milestone[]) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("project_milestones")
      .delete()
      .eq("id", milestoneId)
      .eq("project_id", projectId);
    if (error) throwSaveError(error);
    await Promise.all(
      remaining.map((milestone, index) =>
        supabase
          .from("project_milestones")
          .update({ sort_order: index })
          .eq("id", milestone.id),
      ),
    );
  },

  async reorderMilestones(projectId: string, ordered: Milestone[]) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("project_milestones")
      .delete()
      .eq("project_id", projectId);
    if (error) throwSaveError(error);
    if (ordered.length === 0) return;
    const { error: insertError } = await supabase.from("project_milestones").insert(
      ordered.map((milestone, index) => ({
        id: milestone.id,
        project_id: projectId,
        name: milestone.name,
        status: milestone.status,
        start_date: milestone.startDate,
        end_date: milestone.endDate,
        sort_order: index,
      })),
    );
    if (insertError) throwSaveError(insertError);
  },

  async addDeliveredItem(projectId: string, input: DeliveredItemInput, order: number) {
    const supabase = createSupabaseBrowserClient();
    const item = createDeliveredItem(input, order);
    const { error } = await supabase.from("project_delivered_items").insert({
      id: item.id,
      project_id: projectId,
      name: item.name,
      url: item.url,
      sort_order: item.order,
    });
    if (error) throwSaveError(error);
    return item;
  },

  async updateDeliveredItem(projectId: string, itemId: string, input: DeliveredItemInput) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("project_delivered_items")
      .update({ name: input.name.trim(), url: input.url.trim() })
      .eq("id", itemId)
      .eq("project_id", projectId);
    if (error) throwSaveError(error);
  },

  async deleteDeliveredItem(projectId: string, itemId: string, remaining: DeliveredItem[]) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("project_delivered_items")
      .delete()
      .eq("id", itemId)
      .eq("project_id", projectId);
    if (error) throwSaveError(error);
    await Promise.all(
      remaining.map((item, index) =>
        supabase.from("project_delivered_items").update({ sort_order: index }).eq("id", item.id),
      ),
    );
  },

  async reorderDeliveredItems(projectId: string, ordered: DeliveredItem[]) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("project_delivered_items")
      .delete()
      .eq("project_id", projectId);
    if (error) throwSaveError(error);
    if (ordered.length === 0) return;
    const { error: insertError } = await supabase.from("project_delivered_items").insert(
      ordered.map((item, index) => ({
        id: item.id,
        project_id: projectId,
        name: item.name,
        url: item.url,
        sort_order: index,
      })),
    );
    if (insertError) throwSaveError(insertError);
  },

  async importProjects(projects: Project[]) {
    const imported: Project[] = [];
    for (const project of projects) {
      const logoUrl = await uploadLogoValue(project.logo);
      const created = await this.create({
        name: project.name,
        client: project.client,
        owner: project.owner,
        type: project.type,
        logo: logoUrl,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
      });

      await this.updateDashboard(created.id, {
        ...project.dashboard,
        card2: {
          ...project.dashboard.card2,
          checklistItems: project.dashboard.card2.checklistItems.map((item, index) => ({
            ...item,
            id: crypto.randomUUID(),
            order: index,
          })),
        },
        card3: {
          ...project.dashboard.card3,
          title: created.name,
        },
      });

      for (const [index, milestone] of project.milestones.entries()) {
        await this.addMilestone(
          created.id,
          {
            name: milestone.name,
            status: milestone.status,
            startDate: milestone.startDate,
            endDate: milestone.endDate,
          },
          index,
        );
      }

      for (const [index, item] of project.deliveredItems.entries()) {
        await this.addDeliveredItem(
          created.id,
          { name: item.name, url: item.url },
          index,
        );
      }

      imported.push(await fetchProject(created.id));
    }
    return imported;
  },
};

export type SupabaseProjectRepository = typeof supabaseProjectRepository;
