import { getSessionCookieName } from "@/lib/simple-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  const res = NextResponse.redirect(url, { status: 302 });
  res.cookies.set(getSessionCookieName(), "", { path: "/", maxAge: 0 });
  return res;
}
