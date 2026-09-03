import type { ProjectType } from "@/lib/types";

export const TYPE_LABELS: Record<ProjectType, string> = {
  Website: "WEBSITE",
  Mobapp: "MOBAPP",
  Webapp: "WEBAPP",
  "UXUI Design": "UXUI DESIGN",
  Branding: "BRANDING",
};

export const TYPE_STYLES: Record<ProjectType, string> = {
  Website: "bg-slate-100 text-slate-700 ring-slate-200",
  Mobapp: "bg-violet-50 text-violet-700 ring-violet-200",
  Webapp: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "UXUI Design": "bg-teal-50 text-teal-700 ring-teal-200",
  Branding: "bg-rose-50 text-rose-700 ring-rose-200",
};
