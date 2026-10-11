import { NextResponse } from "next/server";
import { SESSION_COOKIE, authConfigured, createSession, matchPassword, sessionCookieOptions } from "@/lib/server/auth";
import { isLimited, recordHit } from "@/lib/server/ratelimit";

const WINDOW = 15 * 60 * 1000;
const MAX_FAILURES = 8;

export async function POST(req: Request) {
  if (!authConfigured()) {
    return NextResponse.json({ ok: false, message: "Login isn't configured on this deployment." }, { status: 503 });
  }
  // Only failed attempts count, so signing in and out repeatedly never locks anyone out.
  if (isLimited(req, "login", MAX_FAILURES, WINDOW)) {
    return NextResponse.json({ ok: false, message: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  const match = password ? matchPassword(password) : null;
  if (!match) {
    recordHit(req, "login", WINDOW);
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ ok: false, message: "That password didn't work." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, createSession(match), sessionCookieOptions);
  return res;
}
