import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant = "default" | "secondary" | "success" | "error" | "warning" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-brand-600 text-white dark:bg-brand-600 dark:text-white",
  secondary:
    "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  success:
    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  error:
    "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  warning:
    "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500",
  outline:
    "border border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
