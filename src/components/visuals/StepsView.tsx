"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Step } from "@/lib/schema";

export function StepsView({ steps, accent, large = false }: { steps: Step[]; accent: string; large?: boolean }) {
  const [i, setI] = useState(0);
  const valid = steps.filter((s) => s && s.label);
  const count = valid.length;

  // In the lightbox, ←/→ step through the states.
  useEffect(() => {
    if (!large) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, count - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [large, count]);

  if (!count) return null;
  const idx = Math.min(i, valid.length - 1);
  const step = valid[idx];
  const items = (step.items ?? []).slice(0, 10);
  const highlight = new Set(step.highlight ?? []);
  const dim = new Set(step.dim ?? []);
  const metricMax = Math.max(...valid.map((s) => Math.abs(s.metric_value ?? 0)), 1);
  const hasMetric = !!step.metric_label;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Steps">
        {valid.map((s, n) => (
          <button
            key={n}
            role="tab"
            aria-selected={n === idx}
            onClick={() => setI(n)}
            className={`h-7 min-w-7 rounded-[3px] border px-2 font-mono text-[11px] ${
              n === idx ? "border-teal bg-teal-light text-teal" : "border-line bg-surface text-muted"
            }`}
          >
            {n + 1}
          </button>
        ))}
        <span className={`ml-1 font-bold ${large ? "text-[17px]" : "text-[13px]"}`}>{step.label}</span>
      </div>

      {items.length > 0 && (
        <div className="mb-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, ${large ? 140 : 88}px))` }}>
          {items.map((item, n) => {
            const hi = highlight.has(n);
            const dm = dim.has(n);
            return (
              <div key={n} className="flex flex-col items-center gap-1">
                <div
                  className={`flex w-full items-center justify-center rounded-[3px] border font-bold tabular-nums ${large ? "h-20 text-[20px]" : "h-12 text-[13px]"}`}
                  style={{
                    borderColor: hi ? "var(--orange)" : dm ? "var(--dim-border)" : accent,
                    background: hi ? "var(--sparkle)" : dm ? "var(--dim-bg)" : "var(--surface)",
                    color: dm ? "var(--dim-text)" : "var(--ink)",
                    borderWidth: hi ? 2 : 1,
                    textDecoration: dm ? "line-through" : undefined,
                  }}
                >
                  {item}
                </div>
                <span className={`font-mono text-muted ${large ? "text-[11px]" : "text-[9px]"}`}>{n}</span>
              </div>
            );
          })}
        </div>
      )}

      {hasMetric && (
        <div className="mb-3 flex items-center gap-3">
          <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-[0.5px] text-muted">{step.metric_label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-[3px] bg-skeleton">
            <div
              className="h-full rounded-[3px]"
              style={{
                width: `${(Math.abs(step.metric_value) / metricMax) * 100}%`,
                background: accent,
                transition: "width 0.18s",
              }}
            />
          </div>
          <span className={`w-24 shrink-0 text-right font-bold tabular-nums ${large ? "text-[18px]" : "text-[13px]"}`}>
            {Number.isInteger(step.metric_value) ? step.metric_value.toLocaleString() : step.metric_value.toFixed(2)}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <p className={`m-0 leading-[1.65] ${large ? "text-[18px]" : "text-[14px]"}`}>{step.note}</p>
        <div className="flex shrink-0 gap-1.5">
          <button className="action-button !p-2" aria-label="Previous step" disabled={idx === 0} onClick={() => setI(idx - 1)}>
            <ChevronLeft size={16} />
          </button>
          <button
            className="action-button !p-2"
            aria-label="Next step"
            disabled={idx === valid.length - 1}
            onClick={() => setI(idx + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
