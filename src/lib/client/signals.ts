"use client";

/**
 * Learning signals (PRD §8.6). Logged locally only; this is groundwork for
 * learning which explanation styles work for which student.
 */
export interface Signal {
  at: number;
  concept: string;
  interest: string;
  visual: string;
  mode: string;
  event: "card" | "check" | "feedback" | "watch";
  correct?: boolean;
  clicked?: boolean;
  tier?: number;
}

const KEY = "lens.signals";

export function logSignal(s: Omit<Signal, "at">) {
  try {
    const all: Signal[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    all.push({ ...s, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(all.slice(-500)));
  } catch {
    /* storage full or disabled; signals are best-effort */
  }
}

export function readSignals(): Signal[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export interface SignalSummary {
  cards: number;
  checks: number;
  correct: number;
  clicked: number;
  byInterest: Record<string, { cards: number; correct: number; checks: number; clicked: number }>;
}

export function summarize(signals: Signal[]): SignalSummary {
  const s: SignalSummary = { cards: 0, checks: 0, correct: 0, clicked: 0, byInterest: {} };
  for (const e of signals) {
    const b = (s.byInterest[e.interest] ??= { cards: 0, correct: 0, checks: 0, clicked: 0 });
    if (e.event === "card") { s.cards++; b.cards++; }
    if (e.event === "check") { s.checks++; b.checks++; if (e.correct) { s.correct++; b.correct++; } }
    if (e.event === "feedback" && e.clicked) { s.clicked++; b.clicked++; }
  }
  return s;
}
