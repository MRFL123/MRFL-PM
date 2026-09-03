"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { PROJECT_ASSETS_BUCKET } from "@/lib/supabase/env";

function extensionFor(contentType: string, fallback = "png"): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("svg")) return "svg";
  return fallback;
}

export function isProjectAssetUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes(`/storage/v1/object/public/${PROJECT_ASSETS_BUCKET}/`);
}

export function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${PROJECT_ASSETS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0] ?? "");
}

export async function uploadProjectAsset(file: Blob, contentType: string, folder = "logos") {
  const supabase = createSupabaseBrowserClient();
  const ext = extensionFor(contentType);
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PROJECT_ASSETS_BUCKET).upload(path, file, {
    contentType,
    upsert: false,
  });
  if (error) {
    throw new Error(error.message || "Could not upload image.");
  }
  const { data } = supabase.storage.from(PROJECT_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeProjectAsset(url: string | null | undefined) {
  if (!url || !isProjectAssetUrl(url)) return;
  const path = storagePathFromPublicUrl(url);
  if (!path) return;
  const supabase = createSupabaseBrowserClient();
  await supabase.storage.from(PROJECT_ASSETS_BUCKET).remove([path]);
}

export function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1] ?? "image/png";
  const binary = atob(match[2] ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { blob: new Blob([bytes], { type: contentType }), contentType };
}

export async function uploadLogoValue(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("data:")) {
    const parsed = dataUrlToBlob(value);
    if (!parsed) throw new Error("Could not read this image.");
    return uploadProjectAsset(parsed.blob, parsed.contentType);
  }
  return value;
}
