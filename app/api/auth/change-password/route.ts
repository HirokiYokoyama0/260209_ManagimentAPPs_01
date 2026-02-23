import { verifySessionCookieServer, getSessionCookieName } from "@/lib/simple-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const SALT_ROUNDS = 10;

/**
 * ログイン中のスタッフが自分のパスワードを変更する。
 * Body: current_password, new_password（JSON または form）
 */
export async function POST(request: NextRequest) {
  const cookieName = getSessionCookieName();
  const cookieValue = request.cookies.get(cookieName)?.value;
  const session = verifySessionCookieServer(cookieValue);
  if (!session?.staffId) {
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }

  let currentPassword = "";
  let newPassword = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const json = await request.json();
      currentPassword = (json.current_password ?? "").toString();
      newPassword = (json.new_password ?? "").toString();
    } catch {
      return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
    }
  } else {
    const formData = await request.formData();
    currentPassword = (formData.get("current_password") ?? "").toString();
    newPassword = (formData.get("new_password") ?? "").toString();
  }

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "現在のパスワードと新しいパスワードを入力してください。" },
      { status: 400 }
    );
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "新しいパスワードは6文字以上にしてください。" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: staff, error: fetchError } = await supabase
      .from("staff")
      .select("id, password_hash")
      .eq("id", session.staffId)
      .single();

    if (fetchError || !staff?.password_hash) {
      return NextResponse.json({ error: "スタッフ情報の取得に失敗しました。" }, { status: 500 });
    }

    const ok = await bcrypt.compare(currentPassword, staff.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "現在のパスワードが正しくありません。" },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const { error: updateError } = await supabase
      .from("staff")
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq("id", session.staffId);

    if (updateError) {
      return NextResponse.json({ error: "パスワードの更新に失敗しました。" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "エラーが発生しました。" }, { status: 500 });
  }
}
