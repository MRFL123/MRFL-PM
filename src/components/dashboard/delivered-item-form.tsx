"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeliveredItem, DeliveredItemInput } from "@/lib/types";
import { normalizeHttpUrl, validateDeliveredItem } from "@/lib/urls";

function DeliveredItemFormFields({
  item,
  onOpenChange,
  onSubmit,
}: {
  item?: DeliveredItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: DeliveredItemInput) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateDeliveredItem(name, url);
    if (validationError) {
      setError(validationError);
      return;
    }
    const normalized = normalizeHttpUrl(url);
    if (!normalized) {
      setError("Enter a valid link.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), url: normalized });
      onOpenChange(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{item ? "Edit Delivered Item" : "Add Delivered Item"}</DialogTitle>
        <DialogDescription>
          Add a client-facing name and the link to the delivered work.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-1.5">
        <Label htmlFor="delivered-name">Item Name</Label>
        <Input
          id="delivered-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="UX/UI Design"
          autoFocus
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="delivered-url">Link</Label>
        <Input
          id="delivered-url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://figma.com/design/xxxxx"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : item ? "Save Changes" : "Add Item"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DeliveredItemForm({
  open,
  item,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  item?: DeliveredItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: DeliveredItemInput) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <DeliveredItemFormFields
            key={item?.id ?? "create"}
            item={item}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
