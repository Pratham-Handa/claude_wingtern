"use client";

import { useEffect, useId, useState } from "react";
import { passHeader } from "@/lib/client/stream";
import { useThemeColors, type ThemeColors } from "@/lib/client/theme";

type State = { status: "loading" } | { status: "ok"; svg: string } | { status: "failed" };

/** Rendered SVGs by source + theme + accent, so theme switches and the lightbox are instant. */
const svgCache = new Map<string, string>();
/** Haiku-repaired sources, so a theme switch never triggers a second repair call. */
const repaired = new Map<string, string>();
/** Sources known to be unrenderable even after repair. */
const failed = new Set<string>();

async function getMermaid(accent: string, c: ThemeColors) {
  const mermaid = (await import("mermaid")).default;
  // Re-initialising is cheap and keeps the diagram in step with the current theme.
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    fontFamily: "DM Sans, system-ui, sans-serif",
    themeVariables: {
      background: c.surface,
      primaryColor: c.surface,
      primaryTextColor: c.ink,
      primaryBorderColor: accent,
      lineColor: c.ink,
      textColor: c.ink,
      secondaryColor: c.hero,
      tertiaryColor: c.aiBg,
      fontSize: "14px",
      actorBkg: c.surface,
      actorBorder: accent,
      actorTextColor: c.ink,
      actorLineColor: c.muted,
      signalColor: c.ink,
      signalTextColor: c.ink,
      labelBoxBkgColor: c.surface,
      labelBoxBorderColor: c.line,
      labelTextColor: c.ink,
      loopTextColor: c.ink,
      noteBkgColor: c.aiBg,
      noteBorderColor: c.aiBorder,
      noteTextColor: c.ink,
      activationBkgColor: c.sparkle,
      activationBorderColor: c.orange,
      edgeLabelBackground: c.surface,
      clusterBkg: c.cream,
      clusterBorder: c.line,
    },
  });
  return mermaid;
}

/**
 * Renders Mermaid with validation (PRD §7): parse → render; on failure one
 * Haiku repair call; if that also fails, the caller falls back.
 */
export function MermaidView({
  source,
  accent,
  onFail,
  onReady,
  className = "",
}: {
  source: string;
  accent: string;
  onFail?: () => void;
  onReady?: () => void;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { theme, colors } = useThemeColors();
  const key = `${theme}|${accent}|${source}`;
  // Async render results land here; cached results are read straight from the caches.
  const [result, setResult] = useState<{ key: string; state: State } | null>(null);
  const cachedSvg = svgCache.get(key);
  const state: State = cachedSvg
    ? { status: "ok", svg: cachedSvg }
    : failed.has(source)
      ? { status: "failed" }
      : result?.key === key
        ? result.state
        : { status: "loading" };

  useEffect(() => {
    let cancelled = false;
    if (svgCache.has(key)) {
      onReady?.();
      return;
    }
    if (failed.has(source)) {
      onFail?.();
      return;
    }
    (async () => {
      const mermaid = await getMermaid(accent, colors);
      const tryRender = async (src: string) => {
        await mermaid.parse(src);
        const { svg } = await mermaid.render(`m${id}${Math.random().toString(36).slice(2, 7)}`, src);
        return svg;
      };
      const done = (svg: string) => {
        svgCache.set(key, svg);
        if (!cancelled) {
          setResult({ key, state: { status: "ok", svg } });
          onReady?.();
        }
      };
      try {
        done(await tryRender(repaired.get(source) ?? source));
      } catch (err) {
        try {
          const res = await fetch("/api/repair", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...passHeader() },
            body: JSON.stringify({ mermaid: source, error: String(err).slice(0, 900) }),
          });
          const data = await res.json();
          if (!data.mermaid) throw new Error("no repair");
          const svg = await tryRender(data.mermaid);
          repaired.set(source, data.mermaid);
          done(svg);
        } catch {
          failed.add(source);
          if (!cancelled) {
            setResult({ key, state: { status: "failed" } });
            onFail?.();
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // colors is derived from theme, which is part of key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, id]);

  if (state.status === "loading") return <div className="skeleton h-48 w-full" aria-label="Drawing diagram" />;
  if (state.status === "failed") return null;
  return <div className={`mermaid-host flex justify-center ${className}`} dangerouslySetInnerHTML={{ __html: state.svg }} />;
}
