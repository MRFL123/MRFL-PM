import { FolderKanban, LayoutDashboard, ReceiptText, Settings, Users } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Users", href: "/users", icon: Users },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
};

export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
