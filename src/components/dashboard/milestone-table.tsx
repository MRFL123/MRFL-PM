"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MilestoneForm } from "@/components/dashboard/milestone-form";
import { MilestoneRow } from "@/components/dashboard/milestone-row";
import { InvoiceDetailDialog } from "@/components/invoices/invoice-detail-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@/lib/invoices";
import { projectProgress, sortMilestones } from "@/lib/projects";
import { SAVE_ERROR_MESSAGE, useProjects } from "@/lib/store";
import type { Milestone, MilestoneInput, Project } from "@/lib/types";

export function MilestoneTable({ project }: { project: Project }) {
  const { addMilestone, updateMilestone, deleteMilestone, moveMilestone, getInvoiceForMilestone, updateInvoice } =
    useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const milestones = sortMilestones(project.milestones);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    try {
      await moveMilestone(project.id, String(active.id), String(over.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
    }
  };

  const milestonePayload = (milestone: Milestone, overrides: Partial<MilestoneInput> = {}): MilestoneInput => ({
    name: milestone.name,
    description: milestone.description ?? "",
    price: milestone.price ?? 0,
    currency: milestone.currency || "EGP",
    status: milestone.status,
    startDate: milestone.startDate,
    endDate: milestone.endDate,
    ...overrides,
  });

  return (
    <section className="rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Project Progress</h2>
          <p className="text-sm text-muted-foreground">
            {project.milestones.length > 0
              ? `${projectProgress(project)}% complete · milestones, pricing, and invoices.`
              : "Milestones, pricing, status, and dates for this project."}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus data-icon="inline-start" />
          Add Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <p className="text-sm font-medium">No milestones added yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the first milestone to start tracking project progress.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            + Add Milestone
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={milestones.map((milestone) => milestone.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Milestone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((milestone) => {
                  const invoice = getInvoiceForMilestone(milestone.id);
                  return (
                    <MilestoneRow
                      key={milestone.id}
                      milestone={milestone}
                      invoice={invoice}
                      onStatusChange={async (status) => {
                        try {
                          await updateMilestone(
                            project.id,
                            milestone.id,
                            milestonePayload(milestone, { status }),
                          );
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
                        }
                      }}
                      onDatesChange={async (startDate, endDate) => {
                        try {
                          await updateMilestone(
                            project.id,
                            milestone.id,
                            milestonePayload(milestone, { startDate, endDate }),
                          );
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
                        }
                      }}
                      onEdit={() => {
                        setEditing(milestone);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(milestone)}
                      onViewInvoice={(inv) => setViewingInvoice(inv)}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}

      <MilestoneForm
        open={formOpen}
        milestone={editing}
        hasAutomaticInvoice={Boolean(editing && getInvoiceForMilestone(editing.id))}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSubmit={async (input: MilestoneInput) => {
          try {
            if (editing) {
              await updateMilestone(project.id, editing.id, input);
              toast.success("Milestone saved successfully.");
            } else {
              await addMilestone(project.id, input);
              toast.success("Milestone added successfully.");
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
            throw error;
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete milestone"
        description="Are you sure you want to delete this milestone? Linked invoices will keep their amount but lose the milestone link."
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteMilestone(project.id, deleting.id);
            toast.success("Milestone deleted.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
          }
        }}
      />

      <InvoiceDetailDialog
        invoice={viewingInvoice}
        projectLogoUrl={project.logo}
        open={Boolean(viewingInvoice)}
        onOpenChange={(open) => {
          if (!open) setViewingInvoice(null);
        }}
        onUpdate={updateInvoice}
        onSaved={(invoice) => setViewingInvoice(invoice)}
      />
    </section>
  );
}
