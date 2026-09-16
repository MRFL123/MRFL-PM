"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and workspace." />

      <div className="mx-auto w-full max-w-[88rem] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You are signed in with your Mirrorful workspace account.
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm text-foreground">{user?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Authentication</dt>
              <dd className="mt-1 text-sm text-foreground">Supabase (email &amp; password)</dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-border pt-4">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-foreground">Workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects, milestones, and reports are stored securely in Supabase and shared across your
            workspace.
          </p>
        </section>
      </div>
    </div>
  );
}
