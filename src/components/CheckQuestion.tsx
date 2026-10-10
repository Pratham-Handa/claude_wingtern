"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";

interface Option {
  text: string;
  correct: boolean;
  why: string;
}

/** Stable shuffle so the correct answer isn't always first. */
function shuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1597334677);
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function CheckQuestion({
  question,
  options,
  onAnswer,
}: {
  question: string;
  options: Option[];
  onAnswer?: (correct: boolean) => void;
}) {
  const shuffled = useMemo(() => shuffle(options, question), [options, question]);
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  return (
    <div>
      <p className="mb-4 mt-0 text-[16px] font-bold leading-[1.5]">{question}</p>
      <div className="grid gap-2">
        {shuffled.map((o, i) => {
          const isPicked = picked === i;
          const tone = !answered ? "idle" : o.correct ? "right" : isPicked ? "wrong" : "other";
          const styles: Record<string, string> = {
            idle: "border-[#bbd0cd] bg-white",
            right: "border-active bg-active-bg",
            wrong: "border-flagged bg-flagged-bg",
            other: "border-line bg-white opacity-80",
          };
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => {
                setPicked(i);
                onAnswer?.(o.correct);
              }}
              className={`flex w-full items-start gap-3 rounded-[4px] border p-3.5 text-left text-[14px] disabled:cursor-default ${styles[tone]}`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border font-mono text-[10px] ${
                  tone === "right"
                    ? "border-active bg-active text-white"
                    : tone === "wrong"
                      ? "border-flagged bg-flagged text-white"
                      : "border-[#bbd0cd] text-teal"
                }`}
              >
                {tone === "right" ? <Check size={12} /> : tone === "wrong" ? <X size={12} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">
                <span className="font-semibold text-ink">{o.text}</span>
                {answered && (o.correct || isPicked) && (
                  <span className={`mt-1 block text-[13px] leading-[1.55] ${o.correct ? "text-active-text" : "text-flagged-text"}`}>
                    {o.why}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="mb-0 mt-3 text-[13px] font-bold" role="status">
          {shuffled[picked].correct ? "✓ Nailed it." : "Not quite. The explanation above shows why."}
        </p>
      )}
    </div>
  );
}
