export const STATUSES = [
  "None",
  "On Hold",
  "In Progress",
  "Delivered",
  "Delay",
] as const;

export type Status = (typeof STATUSES)[number];

export const PROJECT_TYPES = [
  "Website",
  "Mobapp",
  "Webapp",
  "UXUI Design",
  "Branding",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

export const DATE_FILTERS = [
  "All",
  "This month",
  "Upcoming",
  "Overdue",
  "No dates",
] as const;

export type DateFilter = (typeof DATE_FILTERS)[number];

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface WeeklyUpdatesCard {
  title: string;
  content: string;
}

export interface PrerequisiteCard {
  title: string;
  checklistItems: ChecklistItem[];
}

export interface CoverCard {
  title: string;
  subtitle: string;
}

export interface ProjectDashboardData {
  card1: WeeklyUpdatesCard;
  card2: PrerequisiteCard;
  card3: CoverCard;
}

export interface DeliveredItem {
  id: string;
  name: string;
  url: string;
  order: number;
}

export interface Milestone {
  id: string;
  name: string;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  owner: string;
  type: ProjectType;
  logo: string | null;
  description: string;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  dashboard: ProjectDashboardData;
  deliveredItems: DeliveredItem[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInput {
  name: string;
  client: string;
  owner: string;
  type: ProjectType;
  logo: string | null;
  description: string;
  status: Status;
  startDate: string | null;
  endDate: string | null;
}

export interface DeliveredItemInput {
  name: string;
  url: string;
}

export interface MilestoneInput {
  name: string;
  status: Status;
  startDate: string | null;
  endDate: string | null;
}
