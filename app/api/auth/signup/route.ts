import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

const SALT_ROUNDS = 10;

/**
 * スタッフ登録（サインアップ）。
 * login_id が重複していなければ登録可能。
 * ⚠️ セキュリティ注意: 現在は誰でもアクセス可能（将来的に認証必須に変更推奨）
 */
export async function POST(request: NextRequest) {
  let loginId = "";
  let password = "";
  let displayName = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    loginId = (formData.get("login_id") ?? "").toString().trim();
    password = (formData.get("password") ?? "").toString();
    displayName = (formData.get("display_name") ?? "").toString().trim();
  } else {
    try {
      const json = await request.json();
      loginId = (json.login_id ?? "").toString().trim();
      password = (json.password ?? "").toString();
      displayName = (json.display_name ?? "").toString().trim();
    } catch {
      // ignore
    }
  }

  if (!loginId || !password) {
    return NextResponse.redirect(
      new URL("/admin/login?signup=error", request.url),
      { status: 302 }
    );
  }

  if (password.length < 6) {
    return NextResponse.redirect(
      new URL("/admin/login?signup=error", request.url),
      { status: 302 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();

    // 制限削除: 複数スタッフの登録を許可
    // login_id の重複チェック
    const { data: existingStaff } = await supabase
      .from("staff")
      .select("login_id")
      .eq("login_id", loginId)
      .single();

    if (existingStaff) {
      return NextResponse.redirect(
        new URL("/admin/login?signup=error&reason=duplicate", request.url),
        { status: 302 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const { error: insertError } = await supabase.from("staff").insert({
      login_id: loginId,
      password_hash: passwordHash,
      display_name: displayName || null,
      is_active: true,
    });

    if (insertError) {
      return NextResponse.redirect(
        new URL("/admin/login?signup=error", request.url),
        { status: 302 }
      );
    }

    return NextResponse.redirect(
      new URL("/admin/login?signup=success", request.url),
      { status: 302 }
    );
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login?signup=error", request.url),
      { status: 302 }
    );
  }
}
