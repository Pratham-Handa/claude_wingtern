import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SESSION_COOKIE, createByokSession, sessionCookieOptions, sessionKind } from "@/lib/server/auth";
import { isAnthropicKey } from "@/lib/server/byok";
import { MODELS } from "@/lib/server/claude";
import { isLimited, recordHit } from "@/lib/server/ratelimit";

const WINDOW = 15 * 60 * 1000;
const MAX_FAILURES = 8;

/**
 * Checks a visitor's own API key and opens page access for them. The key itself is
 * not stored on the server; the browser keeps it and sends it with each Claude call.
 */
export async function POST(req: Request) {
  // Only failed checks count, same as the password login.
  if (isLimited(req, "byok", MAX_FAILURES, WINDOW)) {
    return NextResponse.json({ ok: false, message: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { key?: unknown } | null;
  const key = typeof body?.key === "string" ? body.key.trim() : "";
  const fail = (message: string, status: number) => {
    recordHit(req, "byok", WINDOW);
    return NextResponse.json({ ok: false, message }, { status });
  };

  if (!isAnthropicKey(key)) return fail("That doesn't look like an Anthropic API key (it starts with sk-ant-).", 400);

  try {
    // Fetching a model checks the key and that it can use Lens's models. It spends no tokens.
    const anthropic = new Anthropic({ apiKey: key, maxRetries: 0 });
    await anthropic.models.retrieve(MODELS.card);
    await anthropic.models.retrieve(MODELS.repair);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      return fail("Anthropic didn't accept that key.", 401);
    }
    if (err instanceof Anthropic.NotFoundError) {
      return fail(`That key can't use ${MODELS.card}. Check your organisation's model access.`, 403);
    }
    return NextResponse.json({ ok: false, message: "Couldn't reach Anthropic to check the key. Try again." }, { status: 502 });
  }

  const res = NextResponse.json({ ok: true });
  // Don't replace an existing password session, so the owner's own login keeps working.
  const current = sessionKind((await cookies()).get(SESSION_COOKIE)?.value);
  if (current !== "password") res.cookies.set(SESSION_COOKIE, createByokSession(), sessionCookieOptions);
  return res;
}
