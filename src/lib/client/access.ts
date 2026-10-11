"use client";

import { useEffect, useState } from "react";
import { useApiKey } from "./apikey";

/**
 * Who may generate new cards. Signed in with the password, or has their own key.
 * signedIn is null while the status is still loading, so nothing flashes a sign-in prompt.
 */
export function useAccess() {
  const apiKey = useApiKey();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { signedIn?: boolean }) => live && setSignedIn(!!d.signedIn))
      .catch(() => live && setSignedIn(null));
    return () => {
      live = false;
    };
  }, []);

  return {
    signedIn,
    /** True only once we know the visitor has neither access: the UI can then block the call. */
    needsSignIn: signedIn === false && !apiKey,
    hasKey: !!apiKey,
  };
}
