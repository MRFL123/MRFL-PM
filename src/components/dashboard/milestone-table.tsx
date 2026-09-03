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
import { CollapsiblePanel } from "@/components/dashboard/collapsible-panel";
import { MilestoneForm } from "@/components/dashboard/milestone-form";
import { MilestoneRow } from "@/components/dashboard/milestone-row";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { projectProgress, sortMilestones } from "@/lib/projects";
import { SAVE_ERROR_MESSAGE, useProjects } from "@/lib/store";
import type { Milestone, MilestoneInput, Project } from "@/lib/types";

export function MilestoneTable({
  project,
  expanded,
  onToggle,
}: {
  project: Project;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { addMilestone, updateMilestone, deleteMilestone, moveMilestone } =
    useProjects();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);

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

  return (
    <section className="rounded-xl border border-border bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CollapsiblePanel
        title="Project Progress"
        expanded={expanded}
        onToggle={onToggle}
        headerClassName={expanded ? "border-b border-border pb-4" : undefined}
        headerStart={
          <div>
            <h2 className="text-base font-semibold">Project Progress</h2>
            {expanded ? (
              <p className="text-sm text-muted-foreground">
                {project.milestones.length > 0
                  ? `${projectProgress(project)}% complete · milestones, status, and dates.`
                  : "Milestones, status, and dates for this project."}
              </p>
            ) : null}
          </div>
        }
        headerEnd={
          expanded ? (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus data-icon="inline-start" />
              Add Milestone
            </Button>
          ) : null
        }
      >
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
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((milestone) => (
                  <MilestoneRow
                    key={milestone.id}
                    milestone={milestone}
                    onStatusChange={async (status) => {
                      try {
                        await updateMilestone(project.id, milestone.id, {
                          name: milestone.name,
                          status,
                          startDate: milestone.startDate,
                          endDate: milestone.endDate,
                        });
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
                      }
                    }}
                    onDatesChange={async (startDate, endDate) => {
                      try {
                        await updateMilestone(project.id, milestone.id, {
                          name: milestone.name,
                          status: milestone.status,
                          startDate,
                          endDate,
                        });
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
                      }
                    }}
                    onEdit={() => {
                      setEditing(milestone);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleting(milestone)}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      )}
      </CollapsiblePanel>

      <MilestoneForm
        open={formOpen}
        milestone={editing}
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
        description="Are you sure you want to delete this milestone?"
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
    </section>
  );
}
