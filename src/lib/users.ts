export const USER_ROLES = ["Admin", "Project Manager", "Member"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["Active", "Inactive"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joined: string;
}

export const USER_STATUS_STYLES: Record<UserStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Inactive: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

// Placeholder data used until user management is implemented.
export const SAMPLE_USERS: TeamUser[] = [
  {
    id: "usr-001",
    name: "Avery Chen",
    email: "avery@mirrorful.com",
    role: "Admin",
    status: "Active",
    joined: "2025-02-11",
  },
  {
    id: "usr-002",
    name: "Jordan Blake",
    email: "jordan@mirrorful.com",
    role: "Project Manager",
    status: "Active",
    joined: "2025-05-03",
  },
  {
    id: "usr-003",
    name: "Priya Nair",
    email: "priya@mirrorful.com",
    role: "Member",
    status: "Active",
    joined: "2025-07-19",
  },
  {
    id: "usr-004",
    name: "Marco Rossi",
    email: "marco@mirrorful.com",
    role: "Member",
    status: "Inactive",
    joined: "2025-09-27",
  },
];

export function userInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (name.trim().slice(0, 2) || "?").toUpperCase();
}
