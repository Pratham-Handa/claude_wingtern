"use client";

import { useCallback, useEffect, useState } from "react";
import type { Visual as VisualT } from "@/lib/schema";
import { StepsView } from "./StepsView";
import { ComparisonView } from "./ComparisonView";
import { MermaidView } from "./MermaidView";
import { ZoomPan } from "./VisualLightbox";

/** Picks the renderer for a card's visual. Mermaid failures fall back to steps, then hide. */
export function Visual({
  visual,
  accent,
  streaming,
  enlarged = false,
  onRenderable,
}: {
  visual: VisualT;
  accent: string;
  streaming: boolean;
  /** Lightbox rendering: larger steps/table, zoomable diagram. */
  enlarged?: boolean;
  /** Reports whether something is on screen, so the card knows when "Expand" makes sense. */
  onRenderable?: (ok: boolean) => void;
}) {
  const [mermaidFailed, setMermaidFailed] = useState(false);
  const [mermaidReady, setMermaidReady] = useState(false);
  const onFail = useCallback(() => setMermaidFailed(true), []);
  const onReady = useCallback(() => setMermaidReady(true), []);
  const type = visual.type;
  const isMermaid = type === "flowchart" || type === "graph" || type === "sequence";
  const hasSteps = !!visual.steps?.length;

  const renderable =
    !streaming &&
    (type === "steps" ? hasSteps : type === "comparison" ? !!visual.comparison_columns?.length : isMermaid ? (mermaidFailed ? hasSteps : mermaidReady) : false);

  useEffect(() => {
    onRenderable?.(renderable);
  }, [renderable, onRenderable]);

  if (type === "steps" && hasSteps) return <StepsView steps={visual.steps} accent={accent} large={enlarged} />;
  if (type === "comparison") return <ComparisonView columns={visual.comparison_columns} rows={visual.comparison_rows} large={enlarged} />;
  if (isMermaid) {
    // Wait for the full source before rendering, since partial Mermaid never parses.
    if (streaming) return <div className="skeleton h-48 w-full" aria-label="Drawing diagram" />;
    if (mermaidFailed) return hasSteps ? <StepsView steps={visual.steps} accent={accent} large={enlarged} /> : null;
    if (!visual.mermaid) return null;
    const view = (
      <MermaidView source={visual.mermaid} accent={accent} onFail={onFail} onReady={onReady} className={enlarged ? "enlarged" : ""} />
    );
    return enlarged ? <ZoomPan>{view}</ZoomPan> : view;
  }
  return null;
}

export function hasVisual(v?: Partial<VisualT>): boolean {
  if (!v?.type || v.type === "none") return false;
  if (v.type === "steps") return !!v.steps?.length;
  if (v.type === "comparison") return !!v.comparison_columns?.length;
  return true;
}
