import { NextResponse, type NextRequest } from "next/server";
import { isSiteEnabled } from "@/lib/site";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Interrupteur SITE_ENABLED : site coupé = plus rien ne fonctionne (même avec une session valide).
  if (!isSiteEnabled()) {
    if (pathname === "/maintenance") return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Site désactivé" }, { status: 503 });
    return NextResponse.rewrite(new URL("/maintenance", request.url), { status: 503 });
  }
  if (pathname === "/maintenance") return NextResponse.redirect(new URL("/", request.url));

  const authed = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return authed ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (!authed) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-.*\\.jpeg|manifest.webmanifest|sw.js|offline|icon-.*\.png|apple-touch-icon.png).*)"],
};
