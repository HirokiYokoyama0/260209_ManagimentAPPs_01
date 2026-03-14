import { logActivityIfStaff } from "@/lib/activity-log";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await logActivityIfStaff(request, "logout");
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  const res = NextResponse.redirect(url, { status: 302 });

  // すべての admin_session_* および admin_session を削除
  request.cookies.getAll().forEach(cookie => {
    if (cookie.name === 'admin_session' || cookie.name.startsWith('admin_session_')) {
      res.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
  });

  return res;
}
