"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Caption narration with the browser's built-in voice (Web Speech API).
 * Off by default: browsers block audio until the user interacts, and an
 * explicit toggle is that interaction.
 */
const KEY = "lens.narration";
const EVENT = "lens-narration-change";

const isSupported = () => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

function readEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

let chosenVoice: SpeechSynthesisVoice | null = null;

/** Prefer natural/neural English voices (Edge "Natural", Chrome "Google"), else the default. */
function pickVoice(): SpeechSynthesisVoice | null {
  if (chosenVoice) return chosenVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase().startsWith("en") ? 10 : 0) +
    (/natural|neural/i.test(v.name) ? 4 : 0) +
    (/google/i.test(v.name) ? 2 : 0) +
    (/en[-_](gb|us|in|au)/i.test(v.lang) ? 1 : 0) +
    (v.default ? 0.5 : 0);
  chosenVoice = [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
  return chosenVoice;
}

export function useNarration() {
  const supported = useSyncExternalStore(subscribe, isSupported, () => false);
  const enabled = useSyncExternalStore(subscribe, readEnabled, () => false);
  const token = useRef(0);

  useEffect(() => {
    if (!isSupported()) return;
    const onVoices = () => {
      chosenVoice = null;
      pickVoice();
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
  }, []);

  const cancel = useCallback(() => {
    token.current++;
    if (isSupported()) window.speechSynthesis.cancel();
  }, []);

  /** Speaks text; resolves when finished, cancelled or failed (never rejects). */
  const speak = useCallback((text: string): Promise<void> => {
    if (!isSupported() || !text.trim()) return Promise.resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const my = ++token.current;
    return new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      }
      u.rate = 1;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(safety);
        resolve();
      };
      // Some engines occasionally never fire "end"; don't let the player hang.
      const safety = setTimeout(finish, 4000 + text.length * 110);
      u.onend = finish;
      u.onerror = finish;
      if (my === token.current) synth.speak(u);
      else finish();
    });
  }, []);

  const setEnabled = useCallback(
    (on: boolean) => {
      try {
        localStorage.setItem(KEY, on ? "on" : "off");
      } catch {
        /* ignore */
      }
      if (!on) cancel();
      window.dispatchEvent(new Event(EVENT));
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { supported, enabled, setEnabled, toggle: () => setEnabled(!enabled), speak, cancel };
}
