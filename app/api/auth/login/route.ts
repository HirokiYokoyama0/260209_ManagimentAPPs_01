import {
  createSessionToken,
  getSessionCookieOptions,
  validateCredentials,
} from "@/lib/simple-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let username = "";
  let password = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    username = (formData.get("username") ?? "") as string;
    password = (formData.get("password") ?? "") as string;
  } else {
    const json = await request.json().catch(() => ({}));
    username = (json.username ?? "") as string;
    password = (json.password ?? "") as string;
  }

  if (!validateCredentials(username, password)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, { status: 302 });
  }

  const token = createSessionToken();
  const opts = getSessionCookieOptions(token);
  const url = request.nextUrl.clone();
  url.pathname = "/admin";
  url.searchParams.delete("error");
  const res = NextResponse.redirect(url, { status: 302 });
  res.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return res;
}
