import { Plan, PLAN_LIMITS, PlanLimits } from "@/types";

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPlanColor(plan: Plan): string {
  switch (plan) {
    case "pro": return "text-brand-600";
    case "business": return "text-amber-600";
    default: return "text-neutral-500";
  }
}

export function getPlanBadgeColor(plan: Plan): string {
  switch (plan) {
    case "pro": return "bg-brand-50 text-brand-700 border-brand-200";
    case "business": return "bg-amber-50 text-amber-700 border-amber-200";
    default: return "bg-neutral-50 text-neutral-600 border-neutral-200";
  }
}
