"use client";

import { parse as parsePartial, Allow } from "partial-json";

export interface StreamHandlers {
  onThink?: (delta: string) => void;
  /** Called with the full accumulated text after each delta. */
  onText?: (full: string) => void;
}

export class LensError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

export function passHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = localStorage.getItem("lens.pass");
  return p ? { "x-lens-pass": p } : {};
}

/** POSTs to a Lens route and consumes its NDJSON event stream. Resolves with the final text. */
export async function streamLens(
  url: string,
  body: unknown,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<{ text: string; stop: string | null }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...passHeader() },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ message: `Request failed (${res.status})` }));
    throw new LensError(err.message ?? "Request failed", err.code);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let stop: string | null = null;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      const ev = JSON.parse(line);
      if (ev.t === "d") {
        text += ev.v;
        handlers.onText?.(text);
      } else if (ev.t === "think") {
        if (ev.v) handlers.onThink?.(ev.v);
      } else if (ev.t === "reset") {
        text = "";
        handlers.onText?.(text);
      } else if (ev.t === "done") {
        stop = ev.stop;
      } else if (ev.t === "error") {
        throw new LensError(ev.message, ev.code);
      }
    }
  }
  if (stop === "refusal") throw new LensError("Lens couldn't answer that one. Try rephrasing the question.", "refusal");
  if (stop === "max_tokens") throw new LensError("The answer was cut off. Try a narrower question.", "max_tokens");
  return { text, stop };
}

/** Best-effort parse of an incomplete JSON document. */
export function partialJson<T>(text: string): Partial<T> | null {
  if (!text.trim()) return null;
  try {
    return parsePartial(text, Allow.ALL) as Partial<T>;
  } catch {
    return null;
  }
}
