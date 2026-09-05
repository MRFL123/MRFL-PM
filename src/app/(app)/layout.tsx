import { AuthenticatedShell } from "@/components/auth/authenticated-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
