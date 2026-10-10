/**
 * Best-effort per-IP limiter. In-memory, so it is per serverless instance;
 * that's enough to stop casual abuse of a public demo URL. The Console
 * workspace spend limit is the real backstop (PRD §8.2a).
 */
const hits = new Map<string, number[]>();

export function rateLimit(req: Request, bucket: string, limit: number, windowMs = 60 * 60 * 1000): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Optional shared passcode: set LENS_PASSCODE on Vercel to require it. */
export function passcodeOk(req: Request): boolean {
  const required = process.env.LENS_PASSCODE;
  if (!required) return true;
  return req.headers.get("x-lens-pass") === required;
}
