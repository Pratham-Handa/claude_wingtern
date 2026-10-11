"use client";

import { useSyncExternalStore } from "react";

/** The visitor's own Anthropic key. It lives only in this browser and is sent per request. */
const STORAGE = "lens.apiKey";
const KEY_HEADER = "x-lens-key";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE);
  } catch {
    return null;
  }
}

export function setApiKey(key: string) {
  localStorage.setItem(STORAGE, key);
  emit();
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE);
  emit();
}

/** Header for Lens API calls when the visitor has a key saved. */
export function apiKeyHeaders(): Record<string, string> {
  const key = getApiKey();
  return key ? { [KEY_HEADER]: key } : {};
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The saved key (or null), kept in sync across the app. */
export function useApiKey(): string | null {
  return useSyncExternalStore(subscribe, getApiKey, () => null);
}
