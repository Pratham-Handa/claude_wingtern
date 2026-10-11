import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Shared-password gate for the whole site (protects the Claude credits).
 * LENS_PASSWORD may hold several comma-separated passwords, so different
 * people can get different ones. Sessions are HMAC-signed cookies.
 */
export const SESSION_COOKIE = "lens_session";
export const SESSION_DAYS = 30;

function passwords(): string[] {
  return (process.env.LENS_PASSWORD ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function authConfigured(): boolean {
  return passwords().length > 0;
}

/**
 * Signing key. With LENS_AUTH_SECRET set, removing one password only logs out
 * that password's sessions. Without it the key is derived from LENS_PASSWORD,
 * so any password change logs everyone out.
 */
function key(): Buffer {
  const secret = process.env.LENS_AUTH_SECRET || `lens-v1:${process.env.LENS_PASSWORD ?? ""}`;
  return createHash("sha256").update(secret).digest();
}

const sha = (s: string) => createHash("sha256").update(s).digest();
/** Short, non-reversible id of a password, stored in the session to allow per-password revocation. */
const passwordId = (p: string) => createHash("sha256").update(`pid:${p}`).digest("hex").slice(0, 12);
const sign = (payload: string) => createHmac("sha256", key()).update(payload).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Returns the matching password, or null. Compares every candidate in constant time. */
export function matchPassword(input: string): string | null {
  const d = sha(input);
  let match: string | null = null;
  for (const p of passwords()) {
    if (timingSafeEqual(d, sha(p)) && match === null) match = p;
  }
  return match;
}

const BYOK_ID = "byok";
const expiry = () => Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
const signed = (payload: string) => `${payload}.${sign(payload)}`;

export function createSession(password: string): string {
  return signed(`${expiry()}.${passwordId(password)}`);
}

/** A page-access session for visitors who checked their own key. It never unlocks the server's key. */
export function createByokSession(): string {
  return signed(`${expiry()}.${BYOK_ID}`);
}

export type SessionKind = "password" | "byok";

/** What kind of session the cookie is, or null if it is missing, forged, expired or revoked. */
export function sessionKind(value: string | undefined): SessionKind | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [exp, pid, sig] = parts;
  if (!safeEqual(sig, sign(`${exp}.${pid}`))) return null;
  if (!(Number(exp) > Date.now())) return null;
  if (pid === BYOK_ID) return "byok";
  return passwords().some((p) => passwordId(p) === pid) ? "password" : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};
