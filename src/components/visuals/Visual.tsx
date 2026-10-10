"use client";

import { useCallback, useState } from "react";
import type { Visual as VisualT } from "@/lib/schema";
import { StepsView } from "./StepsView";
import { ComparisonView } from "./ComparisonView";
import { MermaidView } from "./MermaidView";

/** Picks the renderer for a card's visual. Mermaid failures fall back to steps, then hide. */
export function Visual({ visual, accent, streaming }: { visual: VisualT; accent: string; streaming: boolean }) {
  const [mermaidFailed, setMermaidFailed] = useState(false);
  const onFail = useCallback(() => setMermaidFailed(true), []);
  const type = visual.type;

  if (type === "steps" && visual.steps?.length) return <StepsView steps={visual.steps} accent={accent} />;
  if (type === "comparison") return <ComparisonView columns={visual.comparison_columns} rows={visual.comparison_rows} />;
  if (type === "flowchart" || type === "graph" || type === "sequence") {
    // Wait for the full source before rendering, since partial Mermaid never parses.
    if (streaming) return <div className="skeleton h-48 w-full" aria-label="Drawing diagram" />;
    if (mermaidFailed) {
      return visual.steps?.length ? <StepsView steps={visual.steps} accent={accent} /> : null;
    }
    return visual.mermaid ? <MermaidView source={visual.mermaid} accent={accent} onFail={onFail} /> : null;
  }
  return null;
}

export function hasVisual(v?: Partial<VisualT>): boolean {
  if (!v?.type || v.type === "none") return false;
  if (v.type === "steps") return !!v.steps?.length;
  if (v.type === "comparison") return !!v.comparison_columns?.length;
  return true;
}
