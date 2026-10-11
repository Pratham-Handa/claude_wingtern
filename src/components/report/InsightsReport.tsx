"use client";

import { Printer, X } from "lucide-react";
import type { Card, SceneScript } from "@/lib/schema";
import { Visual, hasVisual } from "../visuals/Visual";

/**
 * A printable summary of one card: the explanation, analogy, diagram, the animated
 * explainer's storyboard, worked example, limits and check. Built from data Lens
 * already has, so it costs no extra Claude calls. "Save as PDF" uses the browser's print dialog.
 */
export function InsightsReport({
  card,
  accent,
  label,
  scenes,
  onClose,
}: {
  card: Card;
  accent: string;
  label: string;
  scenes: SceneScript | null;
  onClose: () => void;
}) {
  const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  return (
    <div
      className="lens-report-overlay report-light fixed inset-0 z-50 overflow-y-auto bg-cream"
      role="dialog"
      aria-modal="true"
      aria-label="Insights report"
    >
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 text-ink">
        <span className="text-[14px] font-bold">Insights report</span>
        <div className="flex gap-2">
          <button className="primary-button !py-2 !text-[13px]" onClick={() => window.print()}>
            <Printer size={14} /> Save as PDF
          </button>
          <button className="action-button !py-2 !text-[13px]" onClick={onClose}>
            <X size={14} /> Close
          </button>
        </div>
      </div>

      <article className="lens-report mx-auto max-w-[760px] px-6 py-8 text-ink">
        <header className="report-section">
          <div className="eyebrow">Wingtern Lens · Insights report</div>
          <h1 className="mb-0 mt-2 text-[34px] font-bold leading-[1.1] tracking-[-1.2px]">{card.concept_title}</h1>
          <p className="mb-0 mt-2 text-[13px] text-muted">
            Through {label} · {date}
          </p>
          {card.interest_reason && <p className="mb-0 mt-3 text-[14px] leading-[1.6]">{card.interest_reason}</p>}
        </header>

        <Section title="1 · The concept">
          <p className="m-0 text-[15px] leading-[1.7]">{card.concept_explanation}</p>
        </Section>

        <Section title={`2 · The analogy: ${card.analogy_title}`}>
          <p className="m-0 text-[15px] leading-[1.7]">{card.analogy_narrative}</p>
          {card.mapping.length > 0 && (
            <table className="mt-4 w-full border-collapse text-[14px]">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-[0.5px] text-muted">
                  <th className="border-b border-line py-2 pr-3 font-normal">The concept</th>
                  <th className="border-b border-line py-2 font-normal">In {label}</th>
                </tr>
              </thead>
              <tbody>
                {card.mapping.map((m, i) => (
                  <tr key={i} className="report-section">
                    <td className="border-b border-line py-2 pr-3 font-bold">{m.concept}</td>
                    <td className="border-b border-line py-2">{m.analogy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {hasVisual(card.visual) && (
          <Section title={`3 · See it: ${card.visual.caption}`}>
            <div className="report-section" style={{ borderTop: `3px solid ${accent}` }}>
              <Visual visual={card.visual} accent={accent} streaming={false} />
            </div>
          </Section>
        )}

        <Section title="4 · Video storyboard">
          {scenes && scenes.scenes.length > 0 ? (
            <ol className="m-0 grid list-none gap-3 p-0">
              {scenes.scenes.map((s, i) => (
                <li key={i} className="report-section grid grid-cols-[28px_1fr] gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-input bg-teal-light font-mono text-[11px] text-teal">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-[14px] font-bold">
                      {s.title} <span className="font-mono text-[11px] font-normal text-muted">· {s.duration}s</span>
                    </div>
                    <div className="mt-0.5 text-[14px] leading-[1.6] text-hero-copy">{s.caption}</div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="m-0 text-[14px] text-muted">
              No animated explainer on this card yet. Press Watch it, then Download insights again, and its storyboard will be included.
            </p>
          )}
        </Section>

        {card.worked_example.length > 0 && (
          <Section title="5 · Worked example">
            <ol className="m-0 grid list-none gap-3 p-0">
              {card.worked_example.map((w, i) => (
                <li key={i} className="report-section grid grid-cols-[28px_1fr] gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-input bg-teal-light font-mono text-[11px] text-teal">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold leading-[1.55]">{w.step}</div>
                    {w.concept_link && <div className="mt-0.5 text-[13px] leading-[1.55] text-muted">→ {w.concept_link}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {card.analogy_limits.length > 0 && (
          <Section title="6 · Where the analogy breaks">
            <ul className="m-0 grid gap-2 pl-5 text-[14px] leading-[1.6]">
              {card.analogy_limits.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </Section>
        )}

        {card.check_options.length > 0 && (
          <Section title="7 · Check yourself">
            <p className="m-0 text-[15px] font-semibold leading-[1.6]">{card.check_question}</p>
            <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-[14px] leading-[1.6]">
              {card.check_options.map((o, i) => (
                <li key={i} className="report-section rounded-input border border-line p-3">
                  <span className="font-bold">{o.correct ? "✓ Correct:" : "✗"}</span> {o.text}
                  <div className="mt-1 text-muted">{o.why}</div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {card.next_concept && (
          <Section title="Next concept to learn">
            <p className="m-0 text-[15px]">{card.next_concept}</p>
          </Section>
        )}

        <footer className="report-section mt-10 border-t border-line pt-4 text-[11px] leading-[1.6] text-muted">
          Generated by Wingtern Lens with Claude. AI explanations can contain mistakes, so check anything important.
          {card.is_finance && " Lens explains financial concepts for learning. It isn't financial advice."}
        </footer>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="report-section mt-9">
      <h2 className="m-0 border-b border-line pb-2 text-[18px] font-bold tracking-[-0.3px]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
