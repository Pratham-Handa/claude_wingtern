"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { Hero, HeroTitle, TopBar } from "@/components/LensApp";
import { setApiKey } from "@/lib/client/apikey";

/** Only same-site paths are allowed as a post-login destination. */
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next") ?? "/";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/";
}

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [key, setKey] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.replace(safeNext());
        return;
      }
      setError(data.message ?? "That password didn't work.");
    } catch {
      setError("Couldn't reach Lens. Check your connection and try again.");
    }
    setBusy(false);
  };

  const submitKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed || keyBusy) return;
    setKeyBusy(true);
    setKeyError(null);
    try {
      const res = await fetch("/api/auth/byok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        // The key stays in this browser; the server only checks it and opens page access.
        setApiKey(trimmed);
        window.location.replace(safeNext());
        return;
      }
      setKeyError(data.message ?? "Anthropic didn't accept that key.");
    } catch {
      setKeyError("Couldn't reach Lens. Check your connection and try again.");
    }
    setKeyBusy(false);
  };

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-[1180px] px-4 pb-20 pt-6 sm:px-6 sm:pt-12">
        <Hero>
          <HeroTitle />
          <p className="mb-6 mt-4 max-w-[520px] text-[15px] leading-[1.65] text-hero-copy">
            Lens is in private preview. Use your own Anthropic API key so your usage is billed to you, or enter the access password.
          </p>

          <div className="grid max-w-[440px] gap-4">
            <form onSubmit={submitKey} className="card !border-t-[3px] !border-t-orange" noValidate>
              <label htmlFor="lens-api-key" className="flex items-center gap-2 text-[13px] font-bold">
                <KeyRound size={14} className="text-teal" /> Your Anthropic API key
              </label>
              <input
                id="lens-api-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                maxLength={320}
                placeholder="sk-ant-…"
                className="field-input mt-2 !py-3 !font-mono !text-[14px]"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setKeyError(null);
                }}
                aria-invalid={!!keyError}
                aria-describedby={keyError ? "lens-api-key-error" : undefined}
              />
              {keyError && (
                <p id="lens-api-key-error" role="alert" className="mb-0 mt-2 text-[12px] font-semibold text-error">
                  {keyError}
                </p>
              )}
              <button type="submit" className="primary-button mt-5 w-full" disabled={!key.trim() || keyBusy}>
                {keyBusy ? "Checking key…" : "Use my key"} <span aria-hidden>→</span>
              </button>
              <p className="mb-0 mt-4 text-[11px] leading-[1.5] text-muted">
                The key is kept in this browser and sent to Anthropic through Lens for each request. It isn&apos;t stored on the server.
              </p>
            </form>

            <form onSubmit={submit} className="card max-w-[440px] !border-t-[3px] !border-t-teal" noValidate>
              <label htmlFor="lens-password" className="flex items-center gap-2 text-[13px] font-bold">
                <Lock size={14} className="text-teal" /> Access password
              </label>
              <div className="relative mt-2">
                <input
                  id="lens-password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={200}
                  className="field-input !py-3 !pr-11 !text-[15px]"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? "lens-password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[3px] text-muted"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <p id="lens-password-error" role="alert" className="mb-0 mt-2 text-[12px] font-semibold text-error">
                  {error}
                </p>
              )}
              <button type="submit" className="action-button mt-5 w-full justify-center" disabled={!password || busy}>
                {busy ? "Checking…" : "Enter with password"} <span aria-hidden>→</span>
              </button>
              <p className="mb-0 mt-4 text-[11px] leading-[1.5] text-muted">
                For people the owner has given free access to. You&apos;ll stay signed in on this device for 30 days.
              </p>
            </form>
          </div>
        </Hero>
      </main>
    </>
  );
}
