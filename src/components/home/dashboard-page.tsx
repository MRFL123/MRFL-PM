"use client";

import { PageHeader } from "@/components/app/page-header";
import { DueMilestones } from "@/components/home/due-milestones";
import { NextInvoices } from "@/components/home/next-invoices";
import { OverviewCards } from "@/components/home/overview-cards";
import { useProjects } from "@/lib/store";

export function DashboardPage() {
  const { ready, loadError, projects } = useProjects();

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Here's what needs your attention today." />

      <div className="mx-auto w-full max-w-[88rem] space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {loadError ? (
          <div className="rounded-xl border border-border bg-white px-6 py-12 text-center">
            <h2 className="text-base font-semibold">Unable to load dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
          </div>
        ) : !ready ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">Project Overview</h2>
              <OverviewCards projects={projects} />
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section>
                <h2 className="mb-3 text-base font-semibold text-foreground">Due Project Milestones</h2>
                <DueMilestones projects={projects} />
              </section>

              <section>
                <h2 className="mb-3 text-base font-semibold text-foreground">Next Invoices</h2>
                <NextInvoices />
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
