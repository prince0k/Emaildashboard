// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* =========================
     PUBLIC ROUTES (SAFE ZONE)
  ========================== */
  if (
    pathname.startsWith("/t/") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/output/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/health"
  ) {
    return NextResponse.next();
  }

  const cookieName = process.env.COOKIE_NAME || process.env.NEXT_PUBLIC_COOKIE_NAME || "token";
  const token = req.cookies.get(cookieName)?.value;
  const basePath = req.nextUrl.basePath || "";

  /* =========================
     LOGIN PAGE LOGIC
  ========================== */
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL(basePath + "/", req.url));
    }
    return NextResponse.next();
  }

  /* =========================
     PROTECTED ROUTES
  ========================== */
  if (!token) {
    const loginUrl = new URL(basePath + "/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};