import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

const SALT_ROUNDS = 10;

/**
 * スタッフ初回登録（サインアップ）。
 * スタッフが 0 人のときだけ 1 件登録可能。それ以外は 403。
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

    const { count, error: countError } = await supabase
      .from("staff")
      .select("*", { count: "exact", head: true });

    if (countError || (count ?? 0) > 0) {
      return NextResponse.redirect(
        new URL("/admin/login?signup=error", request.url),
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
