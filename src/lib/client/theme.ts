"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-script";

export type ThemePref = "system" | "light" | "dark";
export type Theme = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const CHANGE_EVENT = "lens-theme-change";

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function resolveTheme(pref: ThemePref): Theme {
  if (pref === "system") return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  return pref;
}

function apply(pref: ThemePref) {
  document.documentElement.dataset.theme = resolveTheme(pref);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  const onSystem = () => {
    if (readPref() === "system") apply("system");
  };
  mq.addEventListener("change", onSystem);
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    mq.removeEventListener("change", onSystem);
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const getResolved = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

/** Current theme preference and resolved theme; the <head> script sets the initial value. */
export function useTheme() {
  const pref = useSyncExternalStore(subscribe, readPref, () => "system" as ThemePref);
  const theme = useSyncExternalStore(subscribe, getResolved, () => "light" as Theme);

  // Another tab may have changed the preference; re-resolve it here.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) apply(readPref());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    try {
      if (p === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, p);
    } catch {
      /* storage disabled: still apply for this page */
    }
    apply(p);
  }, []);

  return { pref, theme, setPref };
}

export interface ThemeColors {
  ink: string;
  surface: string;
  cream: string;
  orange: string;
  sparkle: string;
  teal: string;
  gold: string;
  muted: string;
  line: string;
  hero: string;
  aiBg: string;
  aiBorder: string;
}

const COLOR_VARS: Record<keyof ThemeColors, string> = {
  ink: "--ink",
  surface: "--surface",
  cream: "--cream",
  orange: "--orange",
  sparkle: "--sparkle",
  teal: "--teal",
  gold: "--hero-gold",
  muted: "--muted",
  line: "--line",
  hero: "--hero",
  aiBg: "--ai-bg",
  aiBorder: "--ai-border",
};

/** Reads the live CSS variables; `theme` must be the theme currently applied to <html>. */
function readColors(theme: Theme): ThemeColors {
  if (typeof window === "undefined" || document.documentElement.dataset.theme !== theme) return LIGHT_FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(COLOR_VARS).map(([k, v]) => [k, cs.getPropertyValue(v).trim() || LIGHT_FALLBACK[k as keyof ThemeColors]]),
  ) as unknown as ThemeColors;
}

/**
 * Resolved hex values of the theme tokens, for renderers that can't use
 * CSS var() (SVG presentation attributes, Mermaid themeVariables).
 */
export function useThemeColors(): { theme: Theme; colors: ThemeColors } {
  const { theme } = useTheme();
  // The CSS variables change whenever the resolved theme does.
  const colors = useMemo(() => readColors(theme), [theme]);
  return { theme, colors };
}

const LIGHT_FALLBACK: ThemeColors = {
  ink: "#19324a",
  surface: "#ffffff",
  cream: "#f7f8f5",
  orange: "#f0724d",
  sparkle: "#fff2eb",
  teal: "#0b7771",
  gold: "#e5a747",
  muted: "#718293",
  line: "#dfe7e6",
  hero: "#e6f0ec",
  aiBg: "#fff8ec",
  aiBorder: "#f0d0a6",
};
