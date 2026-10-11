/**
 * Best-effort per-IP limiter. In-memory, so it is per serverless instance;
 * that's enough to stop casual abuse. The password gate and the Console
 * workspace spend limit are the real backstops (PRD §8.2a).
 */
const hits = new Map<string, number[]>();
const HOUR = 60 * 60 * 1000;

function keyFor(req: Request, bucket: string) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${bucket}:${ip}`;
}

function recent(key: string, windowMs: number): number[] {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.set(key, list);
  return list;
}

/** True if the caller has already used up `limit` hits in the window (doesn't record a hit). */
export function isLimited(req: Request, bucket: string, limit: number, windowMs = HOUR): boolean {
  return recent(keyFor(req, bucket), windowMs).length >= limit;
}

/** Records one hit, e.g. a failed login attempt. */
export function recordHit(req: Request, bucket: string, windowMs = HOUR) {
  recent(keyFor(req, bucket), windowMs).push(Date.now());
}

/** Checks and records in one step; false when the caller is over the limit. */
export function rateLimit(req: Request, bucket: string, limit: number, windowMs = HOUR): boolean {
  if (isLimited(req, bucket, limit, windowMs)) return false;
  recordHit(req, bucket, windowMs);
  return true;
}
