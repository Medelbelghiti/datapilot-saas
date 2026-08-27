import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800", className)} />;
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-64" />
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded flex-1" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-24" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonAnalysis() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-64" />
        <div className="flex gap-2">
          <div className="h-9 bg-neutral-200 dark:bg-neutral-800 rounded w-28" />
          <div className="h-9 bg-neutral-200 dark:bg-neutral-800 rounded w-28" />
        </div>
      </div>
      <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded w-full" />
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
    </div>
  );
}
