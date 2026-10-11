"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, Download, Maximize2 } from "lucide-react";
import type { Card, SceneScript } from "@/lib/schema";
import { accentFor, interestById, labelFor } from "@/lib/interests";
import { Visual, hasVisual } from "./visuals/Visual";
import { VisualLightbox } from "./visuals/VisualLightbox";
import { CheckQuestion } from "./CheckQuestion";
import { WatchIt, cachedScene } from "./motion/WatchIt";
import { InsightsReport } from "./report/InsightsReport";

type PartialCard = Partial<Card>;

function Section({
  eyebrow,
  title,
  accent,
  action,
  children,
  className = "",
}: {
  eyebrow: string;
  title?: string;
  accent?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`} style={accent ? { borderTopColor: accent } : undefined}>
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow">{eyebrow}</div>
        {action}
      </div>
      {title && <h3 className="mb-0 mt-1 text-[19px] font-bold tracking-[-0.35px]">{title}</h3>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card" aria-hidden>
      <div className="skeleton mb-4 h-3 w-24" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton mb-2 h-3" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

export function LearningCard({
  card,
  streaming,
  customInterest,
  presetScript,
  presetCinematic,
  onAnswer,
}: {
  card: PartialCard;
  streaming: boolean;
  customInterest?: string;
  presetScript?: SceneScript;
  presetCinematic?: string;
  onAnswer?: (correct: boolean) => void;
}) {
  const interestId = card.chosen_interest ?? "";
  const accent = accentFor(interestId);
  const interest = interestById(interestId);
  const interestLabel = labelFor(interestId, customInterest);
  const done = !streaming;
  const [visualReady, setVisualReady] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  // Scenes are read when the report opens, so a storyboard generated in the meantime is included.
  const [report, setReport] = useState<{ scenes: SceneScript | null } | null>(null);

  // The section currently being written gets a skeleton after it.
  const has = {
    concept: !!card.concept_explanation,
    analogy: !!card.analogy_narrative,
    mapping: (card.mapping?.length ?? 0) > 0,
    visual: hasVisual(card.visual),
    worked: (card.worked_example?.length ?? 0) > 0,
    limits: (card.analogy_limits?.length ?? 0) > 0,
    check: (card.check_options?.length ?? 0) >= 2,
  };

  return (
    <div className="grid gap-4">
      {/* Header */}
      <header className="pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">Wingtern Lens</span>
          {interestId && (
            <span className="pill" style={{ background: "var(--surface)", border: `1px solid ${accent}`, color: "var(--ink)" }}>
              {interest?.glyph ?? "✦"} via {interestLabel}
            </span>
          )}
          {done && card.concept_title && (
            <button
              className="action-button ml-auto !px-2.5 !py-1.5 !text-[12px]"
              onClick={() => setReport({ scenes: presetScript ?? cachedScene(card as Card) })}
            >
              <Download size={14} /> Download insights
            </button>
          )}
        </div>
        {report && (
          <InsightsReport
            card={card as Card}
            accent={accent}
            label={interestLabel}
            scenes={report.scenes}
            onClose={() => setReport(null)}
          />
        )}
        {card.concept_title ? (
          <h2 className="mb-0 mt-2 text-[clamp(30px,4vw,44px)] font-bold leading-[1.04] tracking-[-1.6px]">{card.concept_title}</h2>
        ) : (
          <div className="skeleton mt-3 h-9 w-1/2" />
        )}
        {card.interest_reason && <p className="mb-0 mt-2 text-[14px] text-hero-copy">{card.interest_reason}</p>}
      </header>

      {/* 1. Concept */}
      {has.concept ? (
        <Section eyebrow="01 · The concept">
          <p className="m-0 text-[16px] leading-[1.7]">{card.concept_explanation}</p>
        </Section>
      ) : (
        <Skeleton />
      )}

      {/* 2 + 3. Analogy and mapping */}
      {has.analogy ? (
        <section className="ai-panel">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ai-tag">02 · The analogy</span>
            <span className="ai-tag" style={{ background: "var(--surface)", border: `1px solid ${accent}`, color: "var(--ink)" }}>
              {interestLabel}
            </span>
          </div>
          <h3 className="mb-0 mt-2 text-[19px] font-bold tracking-[-0.35px]">{card.analogy_title}</h3>
          <p className="mb-0 mt-2 text-[15px] leading-[1.7]">{card.analogy_narrative}</p>

          {has.mapping && (
            <div className="mt-5 overflow-hidden rounded-[5px] border border-ai-divider bg-surface">
              <div className="grid grid-cols-[1fr_auto_1fr] border-b border-ai-divider bg-ai-row px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.5px] text-ai-text">
                <span>The concept</span>
                <span />
                <span>In {interestLabel}</span>
              </div>
              {card.mapping!.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-ai-row-border px-4 py-2.5 text-[14px] last:border-b-0">
                  <span className="font-bold">{m?.concept}</span>
                  <ArrowRight size={14} className="text-ai-button" />
                  <span>{m?.analogy}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mb-0 mt-3 font-mono text-[10px] uppercase tracking-[0.5px] text-ai-meta">
            Structural mapping: every part of the concept has a counterpart
          </p>
        </section>
      ) : has.concept ? (
        <Skeleton lines={4} />
      ) : null}

      {/* 4. Visual + Watch it */}
      {has.visual && card.visual ? (
        <Section
          eyebrow="03 · See it"
          title={card.visual.caption}
          accent={accent}
          action={
            visualReady && (
              <button className="action-button !px-2.5 !py-1.5 !text-[12px]" onClick={() => setEnlarged(true)} aria-label="Enlarge visual">
                <Maximize2 size={14} /> Expand
              </button>
            )
          }
        >
          <div
            className={visualReady ? "cursor-zoom-in" : undefined}
            onClick={(e) => {
              // Clicking the visual enlarges it, except on its own controls (step tabs, arrows).
              if (visualReady && !(e.target as HTMLElement).closest("button, a, [role=tab]")) setEnlarged(true);
            }}
          >
            <Visual visual={card.visual as Card["visual"]} accent={accent} streaming={streaming} onRenderable={setVisualReady} />
          </div>
          <VisualLightbox open={enlarged} onClose={() => setEnlarged(false)} eyebrow="03 · See it" title={card.visual.caption}>
            <Visual visual={card.visual as Card["visual"]} accent={accent} streaming={false} enlarged />
          </VisualLightbox>
        </Section>
      ) : has.mapping && streaming ? (
        <Skeleton lines={2} />
      ) : null}

      {done && card.check_options && (
        <div className="flex flex-wrap items-center gap-3">
          <WatchIt card={card as Card} accent={accent} presetScript={presetScript} presetCinematic={presetCinematic} />
        </div>
      )}

      {/* 5. Worked example */}
      {has.worked && (
        <Section eyebrow="04 · Worked example">
          <ol className="m-0 grid list-none gap-3 p-0">
            {card.worked_example!.map((w, i) => (
              <li key={i} className="grid grid-cols-[28px_1fr] gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-[3px] bg-teal-light font-mono text-[11px] text-teal">{i + 1}</span>
                <div>
                  <div className="text-[14px] font-semibold leading-[1.55]">{w?.step}</div>
                  {w?.concept_link && <div className="mt-0.5 text-[13px] leading-[1.55] text-muted">→ {w.concept_link}</div>}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* 6. Where it breaks */}
      {has.limits && (
        <section className="rounded-[6px] border border-flagged-border bg-flagged-bg p-6">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[1.5px] text-flagged-text">
            <AlertTriangle size={14} /> 05 · Where the analogy breaks
          </div>
          <ul className="mb-0 mt-3 grid gap-2 pl-5 text-[14px] leading-[1.6]">
            {card.analogy_limits!.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 7. Check */}
      {has.check && done ? (
        <Section eyebrow="06 · Check yourself" accent="var(--teal)">
          <CheckQuestion question={card.check_question ?? ""} options={card.check_options as Card["check_options"]} onAnswer={onAnswer} />
        </Section>
      ) : has.limits && streaming ? (
        <Skeleton lines={3} />
      ) : null}

      {done && card.is_finance && (
        <p className="m-0 text-[12px] text-muted">
          Lens explains financial concepts for learning. It isn&apos;t financial advice.
        </p>
      )}
    </div>
  );
}
