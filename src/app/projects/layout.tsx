import { AuthenticatedShell } from "@/components/auth/authenticated-shell";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
