"use client";

import { useEffect, useRef, useState } from "react";
import { Clapperboard, Film, Loader2, RotateCcw, Sparkles } from "lucide-react";
import type { Card, SceneScript } from "@/lib/schema";
import { SceneScriptSchema } from "@/lib/schema";
import { LensError, partialJson, streamLens } from "@/lib/client/stream";
import { logSignal } from "@/lib/client/signals";
import { useFullscreen } from "@/lib/client/fullscreen";
import { useNarration } from "@/lib/client/narration";
import { PlayerExtras, ScenePlayer } from "./ScenePlayer";
import { CLIP_RUNTIME } from "./clipRuntime";

const CSP =
  "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:\">";

/**
 * Lock model-written HTML down (no network, opaque-origin sandbox) and inject
 * the clip runtime (virtual clock + caption bridge) before the clip's own scripts.
 */
function hardenHtml(raw: string): string {
  let html = raw.trim().replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "");
  const csp = /Content-Security-Policy/i.test(html) ? "" : CSP;
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (tag) => tag + csp + CLIP_RUNTIME);
  else html = csp + CLIP_RUNTIME + html;
  return html;
}

function cacheKey(card: Card, tier: number) {
  return `lens.anim${tier}:${card.concept_title}|${card.chosen_interest}|${card.analogy_title}`.slice(0, 200);
}

/** The explainer script already generated for this card on this device (for the insights report). */
export function cachedScene(card: Card): SceneScript | null {
  try {
    const raw = localStorage.getItem(cacheKey(card, 1));
    return raw ? (JSON.parse(raw) as SceneScript) : null;
  } catch {
    return null;
  }
}

type Tier1State =
  | { s: "idle" }
  | { s: "loading"; scenes: number }
  | { s: "ready"; script: SceneScript }
  | { s: "error"; message: string };

type Tier2State =
  | { s: "idle" }
  | { s: "loading"; chars: number; note: string }
  | { s: "ready"; html: string }
  | { s: "error"; message: string };

export function WatchIt({
  card,
  accent,
  presetScript,
  presetCinematic,
}: {
  card: Card;
  accent: string;
  presetScript?: SceneScript;
  presetCinematic?: string;
}) {
  const [open, setOpen] = useState(false);
  const [t1, setT1] = useState<Tier1State>({ s: "idle" });
  const [t2, setT2] = useState<Tier2State>({ s: "idle" });
  const [view, setView] = useState<1 | 2>(1);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const startTier1 = async () => {
    setOpen(true);
    setView(1);
    logSignal({ concept: card.concept_title, interest: card.chosen_interest, visual: card.visual.type, mode: "watch", event: "watch", tier: 1 });
    if (presetScript) return setT1({ s: "ready", script: presetScript });
    const cached = localStorage.getItem(cacheKey(card, 1));
    if (cached) {
      try {
        return setT1({ s: "ready", script: JSON.parse(cached) });
      } catch {
        /* fall through and regenerate */
      }
    }
    setT1({ s: "loading", scenes: 0 });
    abort.current = new AbortController();
    try {
      const { text } = await streamLens(
        "/api/animate",
        { tier: 1, accent, card },
        { onText: (full) => setT1({ s: "loading", scenes: partialJson<SceneScript>(full)?.scenes?.length ?? 0 }) },
        abort.current.signal,
      );
      const parsed = SceneScriptSchema.safeParse(JSON.parse(text));
      if (!parsed.success) throw new LensError("The animation script came back malformed. Try again.");
      localStorage.setItem(cacheKey(card, 1), JSON.stringify(parsed.data));
      setT1({ s: "ready", script: parsed.data });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setT1({ s: "error", message: (err as Error).message });
    }
  };

  const startTier2 = async () => {
    setView(2);
    logSignal({ concept: card.concept_title, interest: card.chosen_interest, visual: card.visual.type, mode: "watch", event: "watch", tier: 2 });
    if (presetCinematic) {
      // Load showcase clips as text so they get the same hardening + caption bridge.
      try {
        const res = await fetch(presetCinematic);
        if (!res.ok) throw new Error();
        return setT2({ s: "ready", html: hardenHtml(await res.text()) });
      } catch {
        return setT2({ s: "error", message: "Couldn't load the cinematic clip." });
      }
    }
    const cached = localStorage.getItem(cacheKey(card, 2));
    if (cached) return setT2({ s: "ready", html: hardenHtml(cached) });
    setT2({ s: "loading", chars: 0, note: "Storyboarding" });
    abort.current = new AbortController();
    try {
      const { text } = await streamLens(
        "/api/animate",
        { tier: 2, accent, card },
        {
          onText: (full) => setT2({ s: "loading", chars: full.length, note: "Writing the animation code" }),
          onThink: () => setT2((p) => (p.s === "loading" && p.chars === 0 ? { ...p, note: "Planning the beats" } : p)),
        },
        abort.current.signal,
      );
      if (!/<(svg|canvas|html|body|div)/i.test(text)) throw new LensError("The cinematic clip didn't come back as HTML. Try again.");
      const html = hardenHtml(text);
      try {
        localStorage.setItem(cacheKey(card, 2), text);
      } catch {
        /* too big for storage; still play it */
      }
      setT2({ s: "ready", html });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setT2({ s: "error", message: (err as Error).message });
    }
  };

  if (!open) {
    return (
      <button className="primary-button" onClick={startTier1}>
        <Clapperboard size={16} /> Watch it
      </button>
    );
  }

  return (
    <section className="card w-full" style={{ borderTopColor: accent }} aria-label="Animated explainer">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">Watch it</div>
          <h3 className="m-0 mt-1 text-[19px] font-bold tracking-[-0.35px]">
            {view === 1 ? "Animated explainer" : "Cinematic version"}
          </h3>
        </div>
        <div className="flex gap-2">
          <button className={`action-button ${view === 1 ? "selected" : ""}`} onClick={() => (t1.s === "idle" ? startTier1() : setView(1))}>
            <Film size={15} /> Explainer
          </button>
          <button className={`action-button ${view === 2 ? "selected" : ""}`} onClick={() => (t2.s === "idle" ? startTier2() : setView(2))}>
            <Sparkles size={15} /> Cinematic · Opus
          </button>
        </div>
      </div>

      {view === 1 && (
        <>
          {t1.s === "loading" && (
            <Progress label={t1.scenes ? `Scripting scene ${t1.scenes}…` : "Lens Motion is storyboarding…"} />
          )}
          {t1.s === "error" && <ErrorNote message={t1.message} onRetry={startTier1} />}
          {t1.s === "ready" && <ScenePlayer script={t1.script} accent={accent} />}
        </>
      )}

      {view === 2 && (
        <>
          {t2.s === "loading" && (
            <Progress
              label={`${t2.note}${t2.chars ? ` · ${(t2.chars / 1000).toFixed(1)}k characters` : ""}`}
              sub="Opus is writing a full motion-graphics piece as code. This usually takes 2 to 4 minutes. The explainer animation is ready sooner."
            />
          )}
          {t2.s === "error" && <ErrorNote message={t2.message} onRetry={startTier2} />}
          {t2.s === "ready" && t2.html && <CinematicPlayer html={t2.html} />}
          <p className="mb-0 mt-3 font-mono text-[10px] uppercase tracking-[0.5px] text-muted">
            No video model: Claude writes this animation as code, and it runs in a sandbox.
          </p>
        </>
      )}
    </section>
  );
}

/** Sandboxed cinematic clip with fullscreen, restart and caption narration. */
function CinematicPlayer({ html }: { html: string }) {
  const { ref: fsRef, active: fsActive, pseudo: fsPseudo, toggle: fsToggle } = useFullscreen<HTMLDivElement>();
  const narration = useNarration();
  const frame = useRef<HTMLIFrameElement>(null);
  const [run, setRun] = useState(0);
  const { speak, cancel, enabled } = narration;

  const tell = (msg: object) => frame.current?.contentWindow?.postMessage(msg, "*");

  // The clip holds each new beat until the previous caption has been spoken,
  // so captions are spoken in order and never cut off.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const data = e.data as { type?: string; text?: unknown };
      if (data?.type !== "lens-caption" || typeof data.text !== "string") return;
      if (!enabled) return;
      void speak(data.text.slice(0, 400)).then(() => tell({ type: "lens-spoken" }));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled, speak]);

  // Keep the clip in sync with the narration toggle (also sent on each iframe load).
  useEffect(() => {
    tell({ type: "lens-narration", on: enabled });
  }, [enabled, run]);

  useEffect(() => cancel, [cancel]);

  return (
    <div
      ref={fsRef}
      tabIndex={-1}
      className={`player-shell outline-none ${fsPseudo ? "lens-pseudo-fs" : ""}`}
      onKeyDown={(e) => {
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          fsToggle();
        }
      }}
      aria-label="Cinematic player"
    >
      <div className="player-stage">
        {/* The clip keeps its own light "paper" stage in both themes. */}
        <div className="stage-box overflow-hidden rounded-[8px] border border-line" style={{ background: "#f7f8f5" }}>
          <iframe
            key={run}
            ref={frame}
            title="Cinematic explainer"
            className="block aspect-video w-full"
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            srcDoc={html}
            onLoad={() => tell({ type: "lens-narration", on: enabled })}
          />
        </div>
      </div>
      <div className="player-controls mt-3 flex items-center gap-2">
        <button
          className="action-button !p-2"
          aria-label="Restart clip"
          onClick={() => {
            cancel();
            setRun((r) => r + 1);
          }}
        >
          <RotateCcw size={16} />
        </button>
        <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.5px] text-muted">
          {narration.supported ? (enabled ? "Narration on · the clip waits for each sentence" : "Turn on narration to hear the captions") : ""}
        </span>
        <PlayerExtras narration={narration} fsActive={fsActive} onFullscreen={fsToggle} />
      </div>
    </div>
  );
}

function Progress({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-dash bg-cream text-center">
      <Loader2 size={22} className="animate-spin text-teal" />
      <div className="text-[13px] font-bold">{label}</div>
      {sub && <div className="max-w-sm px-4 text-[12px] text-muted">{sub}</div>}
    </div>
  );
}

function ErrorNote({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-[5px] border border-flagged-border bg-flagged-bg p-4 text-[13px] text-flagged-text">
      {message}{" "}
      <button className="ml-2 font-bold underline" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
