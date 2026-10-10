"use client";

import { useEffect, useId, useState } from "react";
import { passHeader } from "@/lib/client/stream";

type State = { status: "loading" } | { status: "ok"; svg: string } | { status: "failed" };

let initialized = false;

async function getMermaid(accent: string) {
  const mermaid = (await import("mermaid")).default;
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      fontFamily: "DM Sans, system-ui, sans-serif",
      themeVariables: {
        primaryColor: "#ffffff",
        primaryTextColor: "#19324a",
        primaryBorderColor: accent,
        lineColor: "#19324a",
        secondaryColor: "#e6f0ec",
        tertiaryColor: "#fff8ec",
        fontSize: "14px",
        actorBkg: "#ffffff",
        actorBorder: accent,
        actorTextColor: "#19324a",
        signalColor: "#19324a",
        signalTextColor: "#19324a",
        noteBkgColor: "#fff8ec",
        noteBorderColor: "#f0d0a6",
        activationBkgColor: "#fff2eb",
        activationBorderColor: "#f0724d",
      },
    });
    initialized = true;
  }
  return mermaid;
}

/**
 * Renders Mermaid with validation (PRD §7): parse → render; on failure one
 * Haiku repair call; if that also fails, the caller falls back.
 */
export function MermaidView({ source, accent, onFail }: { source: string; accent: string; onFail?: () => void }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mermaid = await getMermaid(accent);
      const tryRender = async (src: string) => {
        await mermaid.parse(src);
        const { svg } = await mermaid.render(`m${id}${Math.random().toString(36).slice(2, 7)}`, src);
        return svg;
      };
      try {
        const svg = await tryRender(source);
        if (!cancelled) setState({ status: "ok", svg });
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
          if (!cancelled) setState({ status: "ok", svg });
        } catch {
          if (!cancelled) {
            setState({ status: "failed" });
            onFail?.();
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, accent, id, onFail]);

  if (state.status === "loading") return <div className="skeleton h-48 w-full" aria-label="Drawing diagram" />;
  if (state.status === "failed") return null;
  return <div className="mermaid-host flex justify-center" dangerouslySetInnerHTML={{ __html: state.svg }} />;
}
