"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useThemeColors, type ThemeColors } from "@/lib/client/theme";
import { useFullscreen } from "@/lib/client/fullscreen";
import { useNarration } from "@/lib/client/narration";
import type { Scene, SceneElement, SceneScript } from "@/lib/schema";

/* Stage is 160x90 user units (16:9); scripts use a 0-100 grid on both axes. */
const W = 160;
const H = 90;
const sx = (x: number) => (clamp(x, 0, 100) / 100) * W;
const sy = (y: number) => (clamp(y, 0, 100) / 100) * H;

const ICONS: Record<string, string> = {
  ball: "⚽", bat: "🏏", car: "🏎️", flag: "🏁", coin: "🪙", chart: "📈", controller: "🎮",
  trophy: "🏆", person: "🧍", clock: "⏱️", wrench: "🔧", stadium: "🏟️", bank: "🏦", star: "✦",
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : lo));
}

/** Fill defaults so partial or hand-written scripts always render. Unknown kinds are skipped. */
function normalize(script: SceneScript): Scene[] {
  const kinds = new Set(["box", "circle", "label", "arrow", "counter", "bar", "icon"]);
  return (script.scenes ?? [])
    .filter((s) => s && Array.isArray(s.elements))
    .map((s) => ({
      title: s.title ?? "",
      caption: s.caption ?? "",
      duration: clamp(s.duration ?? 6, 3, 12),
      elements: s.elements
        .filter((e) => e && e.id && kinds.has(e.kind))
        .slice(0, 16)
        .map((e) => ({
          id: e.id,
          kind: e.kind,
          x: e.x ?? 50,
          y: e.y ?? 50,
          w: e.w ?? 0,
          h: e.h ?? 0,
          text: e.text ?? "",
          color: e.color ?? "ink",
          icon: e.icon ?? "star",
          enter_at: e.enter_at ?? 0,
          highlight_at: e.highlight_at ?? -1,
          exit_at: e.exit_at ?? -1,
          move_at: e.move_at ?? -1,
          move_to_x: e.move_to_x ?? e.x ?? 50,
          move_to_y: e.move_to_y ?? e.y ?? 50,
          from_id: e.from_id ?? "",
          to_id: e.to_id ?? "",
          value_from: e.value_from ?? 0,
          value_to: e.value_to ?? 0,
        })),
    }));
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

const ease = (p: number) => 1 - Math.pow(1 - clamp(p, 0, 1), 3);

function fmt(n: number) {
  const r = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return r.toLocaleString();
}

export function ScenePlayer({ script, accent }: { script: SceneScript; accent: string }) {
  const scenes = useMemo(() => normalize(script), [script]);
  const ends = useMemo(() => scenes.map((_, i) => scenes.slice(0, i + 1).reduce((a, s) => a + s.duration, 0)), [scenes]);
  const total = ends[ends.length - 1] ?? 0;
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const { colors } = useThemeColors();
  const { ref: fsRef, active: fsActive, pseudo: fsPseudo, toggle: fsToggle } = useFullscreen<HTMLDivElement>();
  const narration = useNarration();
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  // Narration sync: the clock holds at a scene's end until its caption has been spoken.
  const speaking = useRef(false);
  const spokenScene = useRef(-1);

  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const dt = last.current == null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setTime((t) => {
        let next = t + dt;
        const end = ends.find((e) => e > t) ?? total;
        if (speaking.current && next >= end) next = end - 0.0005;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [playing, total, ends]);

  // Locate the current scene and local time.
  let sceneIdx = scenes.length - 1;
  for (let i = 0; i < scenes.length; i++) {
    if (time < ends[i] || i === scenes.length - 1) {
      sceneIdx = i;
      break;
    }
  }
  const scene = scenes[sceneIdx];
  const sceneStart = sceneIdx > 0 ? ends[sceneIdx - 1] : 0;

  const { speak, cancel, enabled: narrate } = narration;
  useEffect(() => {
    if (!scene) return;
    if (!playing || !narrate) {
      cancel();
      speaking.current = false;
      spokenScene.current = -1; // re-speak the current caption on resume
      return;
    }
    if (spokenScene.current === sceneIdx) return;
    spokenScene.current = sceneIdx;
    speaking.current = true;
    const mine = sceneIdx;
    speak(`${scene.title}. ${scene.caption}`).then(() => {
      if (spokenScene.current === mine) speaking.current = false;
    });
  }, [playing, narrate, sceneIdx, scene, speak, cancel]);

  if (!scene) return null;

  // Reduced motion: show each scene's end state; navigation steps scene by scene.
  const local = reduced ? scene.duration : Math.min(time - sceneStart, scene.duration);
  const started = time > 0 || reduced;

  const jump = (i: number) => {
    const target = clamp(i, 0, scenes.length - 1);
    setTime((target > 0 ? ends[target - 1] : 0) + 0.001);
  };

  const toggle = () => {
    if (time >= total) setTime(0);
    setPlaying((p) => !p);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest("button") && (e.key === " " || e.key === "Enter")) return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      toggle();
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      fsToggle();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      jump(sceneIdx + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      jump(sceneIdx - 1);
    }
  };

  return (
    <div
      ref={fsRef}
      tabIndex={-1}
      onKeyDown={onKey}
      className={`player-shell outline-none ${fsPseudo ? "lens-pseudo-fs" : ""}`}
      aria-label="Animation player"
    >
      <div className="player-stage">
        <div className="stage-box relative overflow-hidden rounded-[8px] border border-line bg-cream">
          <svg viewBox={`0 0 ${W} ${H}`} className="block aspect-video w-full" role="img" aria-label={scene.title}>
            <SceneView key={sceneIdx} scene={scene} t={started ? local : -1} accent={accent} c={colors} />
          </svg>
          {!started && (
            <button
              onClick={toggle}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: "color-mix(in srgb, var(--cream) 70%, transparent)" }}
              aria-label="Play animation"
            >
              <span className="primary-button !px-5">
                <Play size={16} /> Play
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-muted">
                {Math.round(total)}s · {scenes.length} scenes
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="player-caption mt-3 flex min-h-[44px] items-start gap-3" aria-live={narrate ? "off" : "polite"}>
        <span className="pill shrink-0">
          {sceneIdx + 1}/{scenes.length}
        </span>
        <p className="m-0 text-[14px] leading-[1.6]">
          <strong>{scene.title}.</strong> {scene.caption}
        </p>
      </div>

      <div className="player-controls mt-3 flex items-center gap-2">
        {reduced ? (
          <>
            <button className="action-button !p-2" aria-label="Previous scene" disabled={sceneIdx === 0} onClick={() => jump(sceneIdx - 1)}>
              <ChevronLeft size={16} />
            </button>
            <button
              className="action-button !p-2"
              aria-label="Next scene"
              disabled={sceneIdx === scenes.length - 1}
              onClick={() => jump(sceneIdx + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : (
          <>
            <button className="action-button !p-2" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              className="action-button !p-2"
              onClick={() => {
                spokenScene.current = -1;
                setTime(0);
                setPlaying(true);
              }}
              aria-label="Replay"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}
        <div className="flex flex-1 gap-1">
          {scenes.map((s, i) => {
            const start = i > 0 ? ends[i - 1] : 0;
            const p = clamp((time - start) / s.duration, 0, 1);
            return (
              <button
                key={i}
                onClick={() => jump(i)}
                className="h-6 flex-1 py-2"
                style={{ flexGrow: s.duration }}
                aria-label={`Scene ${i + 1}: ${s.title}`}
              >
                <span className="block h-1.5 overflow-hidden rounded-[3px] bg-line">
                  <span className="block h-full" style={{ width: `${(reduced ? (i <= sceneIdx ? 1 : 0) : p) * 100}%`, background: accent }} />
                </span>
              </button>
            );
          })}
        </div>
        <PlayerExtras narration={narration} fsActive={fsActive} onFullscreen={fsToggle} />
      </div>
    </div>
  );
}

/** Narration + fullscreen buttons, shared by both players. */
export function PlayerExtras({
  narration,
  fsActive,
  onFullscreen,
}: {
  narration: { supported: boolean; enabled: boolean; toggle: () => void };
  fsActive: boolean;
  onFullscreen: () => void;
}) {
  return (
    <>
      {narration.supported && (
        <button
          className={`action-button !p-2 ${narration.enabled ? "selected" : ""}`}
          onClick={narration.toggle}
          aria-pressed={narration.enabled}
          aria-label={narration.enabled ? "Turn narration off" : "Turn narration on"}
          title={narration.enabled ? "Narration on" : "Narration off"}
        >
          {narration.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      )}
      <button
        className="action-button !p-2"
        onClick={onFullscreen}
        aria-label={fsActive ? "Exit full screen" : "Full screen"}
        title={fsActive ? "Exit full screen (Esc)" : "Full screen (F)"}
      >
        {fsActive ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </>
  );
}

function SceneView({ scene, t, accent, c }: { scene: Scene; t: number; accent: string; c: ThemeColors }) {
  const palette: Record<string, string> = {
    ink: c.ink,
    orange: c.orange,
    teal: c.teal,
    gold: c.gold,
    accent,
    muted: c.muted,
  };
  const barMax = Math.max(1, ...scene.elements.filter((e) => e.kind === "bar").map((e) => Math.max(e.value_from, e.value_to)));

  const pos = (e: SceneElement) =>
    e.move_at >= 0 && t >= e.move_at ? { x: e.move_to_x, y: e.move_to_y } : { x: e.x, y: e.y };
  const visible = (e: SceneElement) => t >= e.enter_at && (e.exit_at < 0 || t < e.exit_at);
  const lit = (e: SceneElement) => e.highlight_at >= 0 && t >= e.highlight_at;
  const byId = new Map(scene.elements.map((e) => [e.id, e]));

  return (
    <g>
      <defs>
        <marker id="lens-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={c.ink} />
        </marker>
      </defs>
      {scene.elements
        .filter((e) => e.kind === "arrow")
        .map((e) => {
          const a = byId.get(e.from_id);
          const b = byId.get(e.to_id);
          if (!a || !b) return null;
          const pa = pos(a);
          const pb = pos(b);
          const x1 = sx(pa.x), y1 = sy(pa.y), x2 = sx(pb.x), y2 = sy(pb.y);
          const len = Math.hypot(x2 - x1, y2 - y1) || 1;
          const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
          const pad = (el: SceneElement) =>
            el.kind === "label" ? Math.min(el.text.length * 1.05 + 2, 30) * Math.abs(ux) + 4 * Math.abs(uy)
            : el.kind === "box" ? ((el.w || 14) / 100) * W * 0.5 * Math.abs(ux) + ((el.h || 10) / 100) * H * 0.5 * Math.abs(uy) + 1.5
            : 7;
          const s1 = pad(a), s2 = pad(b);
          const lx1 = x1 + ux * s1, ly1 = y1 + uy * s1, lx2 = x2 - ux * s2, ly2 = y2 - uy * s2;
          const drawn = Math.max(0, Math.hypot(lx2 - lx1, ly2 - ly1));
          const show = visible(e);
          const col = lit(e) ? c.orange : palette[e.color] ?? c.ink;
          return (
            <g key={e.id}>
              <line
                className="stage-arrow"
                x1={lx1} y1={ly1} x2={lx2} y2={ly2}
                stroke={col}
                strokeWidth={0.7}
                strokeLinecap="round"
                markerEnd="url(#lens-arrow)"
                strokeDasharray={drawn}
                strokeDashoffset={show ? 0 : drawn}
                opacity={show ? 1 : 0}
              />
              {e.text && (
                <text x={(lx1 + lx2) / 2} y={(ly1 + ly2) / 2 - 1.8} textAnchor="middle" fontSize={2.6} fill={c.muted} opacity={show ? 1 : 0} className="stage-el" fontFamily="var(--font-mono)">
                  {e.text}
                </text>
              )}
            </g>
          );
        })}
      {scene.elements
        .filter((e) => e.kind !== "arrow")
        .map((e) => {
          const p = pos(e);
          const show = visible(e);
          const hi = lit(e);
          const col = hi ? c.orange : palette[e.color] ?? c.ink;
          const progress = ease((t - e.enter_at) / 1.5);
          const value = e.value_from + (e.value_to - e.value_from) * (show || t >= e.enter_at ? progress : 0);
          return (
            <g
              key={e.id}
              className="stage-el"
              style={{ transform: `translate(${sx(p.x)}px, ${sy(p.y)}px)`, opacity: show ? 1 : 0 }}
            >
              <g key={hi ? "hi" : "lo"} className={hi ? "stage-pulse" : undefined}>
                <Shape e={e} col={col} hi={hi} value={value} barMax={barMax} c={c} />
              </g>
            </g>
          );
        })}
    </g>
  );
}

function Shape({ e, col, hi, value, barMax, c }: { e: SceneElement; col: string; hi: boolean; value: number; barMax: number; c: ThemeColors }) {
  const font = "var(--font-sans)";
  switch (e.kind) {
    case "box": {
      const w = ((e.w || 14) / 100) * W;
      const h = ((e.h || 10) / 100) * H;
      const fs = Math.min(3.4, (w / Math.max(e.text.length, 3)) * 1.7);
      return (
        <>
          <rect className="stage-shape" x={-w / 2} y={-h / 2} width={w} height={h} rx={1.1} fill={hi ? c.sparkle : c.surface} stroke={col} strokeWidth={hi ? 0.8 : 0.5} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight={700} fill={c.ink} fontFamily={font}>
            {e.text}
          </text>
        </>
      );
    }
    case "circle":
      return (
        <>
          <circle className="stage-shape" r={4.6} fill={hi ? c.sparkle : c.surface} stroke={col} strokeWidth={hi ? 0.9 : 0.6} />
          <circle r={1.6} fill={col} className="stage-shape" />
          {e.text && (
            <text y={8.6} textAnchor="middle" fontSize={2.9} fontWeight={600} fill={c.ink} fontFamily={font}>
              {e.text}
            </text>
          )}
        </>
      );
    case "label": {
      const fs = e.h > 0 ? clamp(e.h * 0.5, 2.4, 7) : e.text.length > 34 ? 3.1 : 3.8;
      return (
        <text textAnchor="middle" dominantBaseline="central" fontSize={fs} fontWeight={hi ? 700 : 600} fill={col} fontFamily={font}>
          {e.text}
        </text>
      );
    }
    case "counter":
      return (
        <>
          <text textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={700} fill={col} fontFamily={font} letterSpacing={-0.3}>
            {fmt(value)}
          </text>
          {e.text && (
            <text y={7} textAnchor="middle" fontSize={2.5} fill={c.muted} fontFamily="var(--font-mono)" letterSpacing={0.4}>
              {e.text.toUpperCase()}
            </text>
          )}
        </>
      );
    case "bar": {
      const w = ((e.w || 7) / 100) * W;
      const maxH = ((e.h || 50) / 100) * H;
      const h = Math.max(0.6, (Math.max(value, 0) / barMax) * maxH);
      return (
        <>
          <rect x={-w / 2} y={-h} width={w} height={h} rx={0.8} fill={col} className="stage-shape" />
          <text y={-h - 2} textAnchor="middle" fontSize={2.6} fontWeight={700} fill={c.ink} fontFamily={font}>
            {fmt(value)}
          </text>
          {e.text && (
            <text y={4} textAnchor="middle" fontSize={2.4} fill={c.muted} fontFamily="var(--font-mono)">
              {e.text}
            </text>
          )}
        </>
      );
    }
    case "icon":
      return (
        <>
          <circle r={6} fill={hi ? c.sparkle : c.surface} stroke={col} strokeWidth={0.5} className="stage-shape" />
          <text textAnchor="middle" dominantBaseline="central" fontSize={6.2}>
            {ICONS[e.icon] ?? "✦"}
          </text>
          {e.text && (
            <text y={10} textAnchor="middle" fontSize={2.8} fontWeight={600} fill={c.ink} fontFamily={font}>
              {e.text}
            </text>
          )}
        </>
      );
    default:
      return null;
  }
}
