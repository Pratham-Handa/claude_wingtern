import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authConfigured, sessionKind } from "@/lib/server/auth";
import { KEY_HEADER } from "@/lib/server/byok";

/**
 * Gates pages, API routes and showcase files. A visitor gets in with the shared
 * password, or with their own API key (page access via a BYOK session, and API
 * calls that carry their key). Production with neither set is locked.
 */
export function proxy(req: NextRequest) {
  // Development without a password stays open for convenience.
  if (!authConfigured() && process.env.NODE_ENV !== "production") return NextResponse.next();

  const kind = sessionKind(req.cookies.get(SESSION_COOKIE)?.value);
  if (kind === "password") return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    // A call with the visitor's own key is billed to them. A BYOK session alone can't spend the server's key.
    if (req.headers.has(KEY_HEADER)) return NextResponse.next();
    return NextResponse.json({ t: "error", code: "auth-required", message: "Please log in to use Lens." }, { status: 401 });
  }
  if (kind === "byok") return NextResponse.next();

  // The home page and the hand-checked example cards cost nothing to show, so anyone can see them.
  // Generating anything new still needs a password or an API key (see the API rules above).
  const path = req.nextUrl.pathname;
  if (path === "/" || path.startsWith("/showcase/")) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except framework assets, the favicon, the login page and the auth API.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth/).*)"],
};
