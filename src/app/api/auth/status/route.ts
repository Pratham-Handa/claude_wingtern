import { cookies } from "next/headers";
import { SESSION_COOKIE, authConfigured, sessionKind } from "@/lib/server/auth";

/** Whether this visitor can generate new cards with the owner's key (password session, or open in development). */
export async function GET() {
  const open = !authConfigured() && process.env.NODE_ENV !== "production";
  const signedIn = open || sessionKind((await cookies()).get(SESSION_COOKIE)?.value) === "password";
  return Response.json({ signedIn }, { headers: { "Cache-Control": "no-store" } });
}
