import { NextResponse, type NextRequest } from "next/server";
import {
  verifySessionCookie,
  getSessionCookieName,
} from "@/lib/simple-auth-verify";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname.startsWith("/admin/login");
  const isProfilesApi = pathname.startsWith("/api/profiles");

  const cookieName = getSessionCookieName();
  const cookieValue = request.cookies.get(cookieName)?.value;
  const isLoggedIn = await verifySessionCookie(cookieValue);

  if (isProfilesApi && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminRoute && !isLoginPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
