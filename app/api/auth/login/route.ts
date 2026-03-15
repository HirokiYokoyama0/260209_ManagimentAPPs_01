import { logActivity } from "@/lib/activity-log";
import {
  createSessionToken,
  getSessionCookieOptions,
  getSessionCookieName,
  validateCredentials,
} from "@/lib/simple-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let username = "";
  let password = "";
  let deviceId = ""; // デバイスIDを受け取る
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    username = (formData.get("username") ?? "").toString().trim();
    password = (formData.get("password") ?? "").toString();
    deviceId = (formData.get("deviceId") ?? "").toString().trim();
  } else {
    const json = await request.json().catch(() => ({}));
    username = (json.username ?? "").toString().trim();
    password = (json.password ?? "").toString();
    deviceId = (json.deviceId ?? "").toString().trim();
  }

  const redirectInvalid = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, { status: 302 });
  };

  // 1. スタッフテーブルで認証を試行
  try {
    const supabase = createSupabaseAdminClient();
    const { data: staff, error } = await supabase
      .from("staff")
      .select("id, password_hash")
      .eq("login_id", username)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && staff && staff.password_hash) {
      const ok = await bcrypt.compare(password, staff.password_hash);
      if (ok) {
        const token = createSessionToken(staff.id);
        const cookieName = getSessionCookieName(deviceId); // デバイスIDからCookie名を生成
        const opts = getSessionCookieOptions(token);
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        url.searchParams.delete("error");
        const res = NextResponse.redirect(url, { status: 302 });

        // デバイス別のCookie名で設定
        res.cookies.set(cookieName, opts.value, {
          httpOnly: opts.httpOnly,
          secure: opts.secure,
          sameSite: opts.sameSite,
          path: opts.path,
          maxAge: opts.maxAge,
        });

        // 古い admin_session Cookie を削除（マイグレーション対応）
        res.cookies.set('admin_session', '', { path: '/', maxAge: 0 });

        const supabase = createSupabaseAdminClient();
        await logActivity(supabase, { staffId: staff.id, action: "login" });
        return res;
      }
    }
  } catch {
    // Supabase 未設定などで落ちた場合は env フォールバックへ
  }

  // 2. 従来の環境変数でフォールバック
  if (!validateCredentials(username, password)) {
    return redirectInvalid();
  }

  const token = createSessionToken();
  const cookieName = getSessionCookieName(deviceId); // デバイスIDからCookie名を生成
  const opts = getSessionCookieOptions(token);
  const url = request.nextUrl.clone();
  url.pathname = "/admin";
  url.searchParams.delete("error");
  const res = NextResponse.redirect(url, { status: 302 });

  // デバイス別のCookie名で設定
  res.cookies.set(cookieName, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });

  // 古い admin_session Cookie を削除（マイグレーション対応）
  res.cookies.set('admin_session', '', { path: '/', maxAge: 0 });

  try {
    const supabase = createSupabaseAdminClient();
    await logActivity(supabase, { staffId: null, action: "login" });
  } catch {
    // ログ記録失敗でもログインは成功扱い
  }
  return res;
}
