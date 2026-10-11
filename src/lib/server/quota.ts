/**
 * Per-password question quota. Each access password may ask LENS_QUESTION_LIMIT questions
 * (default 1). A login cookie can be copied, so the count lives in a shared store:
 * Vercel KV or Upstash Redis, through its REST API (no extra packages).
 * Visitors who use their own API key are never counted here.
 */
const KEY_PREFIX = "lens:questions:";

function store() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function quotaStoreConfigured(): boolean {
  return store() !== null;
}

export function questionLimit(): number {
  const n = Number(process.env.LENS_QUESTION_LIMIT ?? 1);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 1;
}

async function command(args: (string | number)[]): Promise<unknown> {
  const s = store();
  if (!s) throw new Error("quota store not configured");
  const res = await fetch(s.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as { result?: unknown; error?: string } | null;
  if (!res.ok || !data || data.error) throw new Error("quota store error");
  return data.result;
}

/**
 * Takes one question from this password's quota. Returns false when it has none left.
 * The count is incremented atomically, so two simultaneous requests can't both get the last question.
 */
export async function takeQuestion(passwordId: string): Promise<boolean> {
  const key = `${KEY_PREFIX}${passwordId}`;
  const used = Number(await command(["INCR", key]));
  if (used > questionLimit()) {
    await command(["DECR", key]);
    return false;
  }
  return true;
}
