"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound, Lock, Trash2 } from "lucide-react";
import { clearApiKey, setApiKey, useApiKey } from "@/lib/client/apikey";

/** Top-bar button and dialog for the visitor's own Anthropic key (bring-your-own-key). */
export function ApiKeyButton() {
  const saved = useApiKey();
  const dialog = useRef<HTMLDialogElement>(null);

  // Other parts of the app (the sign-in prompt) open this dialog through an event.
  useEffect(() => {
    const open = () => dialog.current?.showModal();
    window.addEventListener("lens:open-key", open);
    return () => window.removeEventListener("lens:open-key", open);
  }, []);

  return (
    <>
      <button
        className={`action-button !px-2.5 !py-2 sm:!px-3.5 ${saved ? "selected" : ""}`}
        aria-label="Your API key"
        title={saved ? "Your API key is saved in this browser" : "Use your own Anthropic API key"}
        onClick={() => dialog.current?.showModal()}
      >
        <KeyRound size={14} /> <span className="hidden sm:inline">{saved ? "Your key" : "API key"}</span>
      </button>
      <ApiKeyDialog dialog={dialog} />
    </>
  );
}

function ApiKeyDialog({ dialog }: { dialog: React.RefObject<HTMLDialogElement | null> }) {
  const saved = useApiKey();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = value.trim();
    if (!key || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/byok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Couldn't check that key.");
      } else {
        setApiKey(key);
        setValue("");
        dialog.current?.close();
      }
    } catch {
      setError("Couldn't reach Lens. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <dialog ref={dialog} className="lens-dialog" aria-labelledby="api-key-title" onClose={() => { setValue(""); setError(null); }}>
      <div className="lens-dialog-inner">
        <div className="eyebrow">Bring your own key</div>
        <h2 id="api-key-title" className="mb-0 mt-2 text-[22px] font-bold tracking-[-0.5px]">
          Use your own Anthropic API key
        </h2>
        <p className="mb-0 mt-2 text-[14px] leading-[1.6] text-muted">
          Lens bills every explanation and animation to the key you give it. The key is kept in this browser and sent to Anthropic
          through Lens&apos;s server for each request. It isn&apos;t stored on the server or logged.
        </p>

        {saved ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="pill">Key saved in this browser</span>
            <button
              className="action-button !py-2 !text-[13px]"
              onClick={() => {
                clearApiKey();
              }}
            >
              <Trash2 size={14} /> Remove key
            </button>
          </div>
        ) : (
          <form onSubmit={save} className="mt-5 grid gap-3" noValidate>
            <label htmlFor="api-key-input" className="flex items-center gap-2 text-[13px] font-bold">
              <Lock size={14} className="text-teal" /> Anthropic API key
            </label>
            <input
              id="api-key-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              className="field-input !font-mono !text-[14px]"
              placeholder="sk-ant-…"
              maxLength={320}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "api-key-error" : undefined}
            />
            {error && (
              <p id="api-key-error" role="alert" className="m-0 text-[12px] font-semibold text-error">
                {error}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button type="submit" className="primary-button" disabled={!value.trim() || busy}>
                {busy ? "Checking…" : "Save key"}
              </button>
              <button type="button" className="text-[13px] font-bold text-muted" onClick={() => dialog.current?.close()}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {saved && (
          <div className="mt-5">
            <button className="text-[13px] font-bold text-muted" onClick={() => dialog.current?.close()}>
              Close
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
