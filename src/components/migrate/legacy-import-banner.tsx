"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  hasPendingLegacyMigration,
  markLegacyMigrationComplete,
  readLegacyProjects,
} from "@/lib/storage/legacy";
import { SAVE_ERROR_MESSAGE, useProjects } from "@/lib/store";

export function LegacyImportBanner() {
  const { importLegacyProjects } = useProjects();
  const [visible, setVisible] = useState(() => hasPendingLegacyMigration());
  const [importing, setImporting] = useState(false);

  if (!visible) return null;

  const count = readLegacyProjects().length;

  return (
    <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-950">
      <p className="font-medium">Local projects found</p>
      <p className="mt-1 text-cyan-900/80">
        {count} project{count === 1 ? "" : "s"} from this browser can be copied into Supabase so
        every device sees the same data. The local copy is kept until you import.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={importing}
          onClick={async () => {
            setImporting(true);
            try {
              const imported = await importLegacyProjects(readLegacyProjects());
              markLegacyMigrationComplete();
              setVisible(false);
              toast.success(
                imported === 1
                  ? "Imported 1 local project."
                  : `Imported ${imported} local projects.`,
              );
            } catch (error) {
              toast.error(error instanceof Error ? error.message : SAVE_ERROR_MESSAGE);
            } finally {
              setImporting(false);
            }
          }}
        >
          {importing ? "Importing…" : "Import local projects"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={importing}
          onClick={() => {
            markLegacyMigrationComplete();
            setVisible(false);
          }}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
