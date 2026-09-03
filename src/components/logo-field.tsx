"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { compressProjectLogo } from "@/lib/images";
import { removeProjectAsset, uploadProjectAsset } from "@/lib/storage/assets";

export function LogoField({
  name,
  logo,
  onChange,
}: {
  name: string;
  logo: string | null;
  onChange: (logo: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    try {
      const { blob, contentType } = await compressProjectLogo(file);
      const url = await uploadProjectAsset(blob, contentType);
      if (logo) await removeProjectAsset(logo);
      onChange(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload logo.");
    }
  };

  return (
    <div className="grid gap-1.5">
      <Label>Project Logo</Label>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
        {logo ? (
          <div className="flex flex-col items-center gap-3 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt={name || "Project logo"}
              className="max-h-24 max-w-[10rem] object-contain"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Replace Logo
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await removeProjectAsset(logo);
                  onChange(null);
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 py-4 text-sm text-muted-foreground hover:text-foreground"
          >
            <ImagePlus className="size-5" />
            + Upload Project Logo
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,.svg"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
