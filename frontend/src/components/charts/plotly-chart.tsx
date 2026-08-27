"use client";

import { cn } from "@/lib/utils";

interface PlotlyTrace {
  type?: string;
  marker?: { color?: string | string[] };
  x?: (string | number | null)[];
  y?: (string | number | null)[];
  z?: (string | number | null)[][];
  values?: (string | number | null)[];
  labels?: (string | number | null)[];
  text?: (string | number | null)[];
  name?: string;
  orientation?: string;
}

interface PlotlyLayout {
  xaxis?: { title?: { text?: string } };
  yaxis?: { title?: { text?: string } };
}

function toNumber(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function normalizeData(raw: unknown): { data: PlotlyTrace[]; layout: PlotlyLayout } {
  if (!raw || typeof raw !== "object") return { data: [], layout: {} };
  const obj = raw as Record<string, unknown>;
  const data = (Array.isArray(obj.data) ? obj.data : []) as PlotlyTrace[];
  const layout = (obj.layout || {}) as PlotlyLayout;
  return { data, layout };
}

export function PlotlyChart({
  data,
  className,
}: {
  data: unknown;
  className?: string;
}) {
  const { data: traces, layout } = normalizeData(data);
  if (!traces.length) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-neutral-400", className)}>
        No chart data
      </div>
    );
  }

  const trace = traces[0];
  const xs = trace.x || trace.labels || [];
  const ys = trace.y || trace.values || [];

  const numYs = ys.map((v) => toNumber(v));
  const maxY = Math.max(...numYs, 1);

  const isVertical = trace.orientation !== "h";
  const barColor =
    (Array.isArray(trace.marker?.color) ? trace.marker!.color[0] : trace.marker?.color) ||
    "#6366f1";

  const xLabel = layout?.xaxis?.title?.text || "";
  const yLabel = layout?.yaxis?.title?.text || "";

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 text-xs text-neutral-500">
        {(xLabel ? `${xLabel}` : "")} {yLabel ? `(${yLabel})` : ""}
      </div>
      <div className="flex h-full min-h-[160px] items-end gap-1 w-full">
        {xs.map((label, i) => {
          const value = numYs[i] ?? 0;
          const pct = Math.max((value / maxY) * 100, 2);
          return (
            <div
              key={i}
              className="flex flex-1 flex-col items-center justify-end gap-1 min-w-0"
              title={`${label ?? ""}: ${value}`}
            >
              <span className="text-[10px] text-neutral-500 truncate w-full text-center">
                {value}
              </span>
              <div
                className="w-full rounded-t"
                style={{ height: `${pct}%`, backgroundColor: barColor }}
              />
              <span className="text-[10px] text-neutral-500 truncate w-full text-center">
                {label ?? ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
