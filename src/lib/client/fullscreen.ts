"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FsDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void };

const fsElement = () => {
  const d = document as FsDocument;
  return d.fullscreenElement ?? d.webkitFullscreenElement ?? null;
};

function subscribe(cb: () => void) {
  document.addEventListener("fullscreenchange", cb);
  document.addEventListener("webkitfullscreenchange", cb);
  return () => {
    document.removeEventListener("fullscreenchange", cb);
    document.removeEventListener("webkitfullscreenchange", cb);
  };
}

/**
 * Fullscreen for a container element. Falls back to a fixed full-viewport
 * overlay ("pseudo" fullscreen) where the element Fullscreen API isn't
 * available, e.g. iPhone Safari.
 */
export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [pseudo, setPseudo] = useState(false);
  const native = useSyncExternalStore(
    subscribe,
    () => !!ref.current && fsElement() === ref.current,
    () => false,
  );

  const enter = useCallback(async () => {
    const el = ref.current as FsElement | null;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else throw new Error("unsupported");
    } catch {
      setPseudo(true);
    }
    el.focus({ preventScroll: true });
  }, []);

  const exit = useCallback(async () => {
    setPseudo(false);
    const d = document as FsDocument;
    if (fsElement()) {
      try {
        if (d.exitFullscreen) await d.exitFullscreen();
        else await d.webkitExitFullscreen?.();
      } catch {
        /* already exited */
      }
    }
  }, []);

  const active = native || pseudo;
  const toggle = useCallback(() => (active ? exit() : enter()), [active, enter, exit]);

  // Esc closes the pseudo mode (native fullscreen handles Esc itself) and locks page scroll.
  useEffect(() => {
    if (!pseudo) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPseudo(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [pseudo]);

  return { ref, active, pseudo, enter, exit, toggle };
}
