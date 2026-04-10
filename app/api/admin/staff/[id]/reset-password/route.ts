import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { verifySessionCookieServer } from "@/lib/simple-auth";

const SALT_ROUNDS = 10;
const TEMPORARY_PASSWORD = "123456"; // 仮パスワード

/**
 * PATCH /api/admin/staff/[id]/reset-password
 * 他のスタッフのパスワードを仮パスワード "123456" にリセットする（管理者のみ）
 *
 * Bodyは不要（仮パスワードに固定）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetStaffId } = await params;

  // セッション確認
  const allCookies = request.cookies.getAll();

  console.log("🔍 パスワードリセットAPI:");
  console.log("  全Cookie数:", allCookies.length);
  console.log("  Cookie名一覧:", allCookies.map(c => c.name).join(", "));

  const sessionCookie = allCookies.find(c => c.name.startsWith('admin_session'));

  if (!sessionCookie) {
    console.log("  ❌ 認証失敗: admin_session Cookie が見つかりません");
    console.log("  利用可能なCookie:", allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + "..." })));
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }

  console.log("  セッションCookie名:", sessionCookie.name);
  console.log("  Cookie値（最初20文字）:", sessionCookie.value.substring(0, 20));

  const session = verifySessionCookieServer(sessionCookie.value);
  console.log("  セッション検証結果:", session);

  if (!session?.staffId) {
    console.log("  ❌ 認証失敗: セッション検証が失敗しました");
    // Cookie値の構造を確認
    const parts = sessionCookie.value.split(".");
    console.log("  Cookie parts数:", parts.length);
    if (parts.length === 3) {
      const [prefix, expStr] = parts;
      console.log("  prefix:", prefix);
      console.log("  expiry:", expStr, "現在時刻:", Date.now());
      const exp = parseInt(expStr, 10);
      console.log("  有効期限切れ:", exp < Date.now());
    }
    return NextResponse.json(
      { error: "ログインしてください。" },
      { status: 401 }
    );
  }

  console.log("  ✅ 認証成功: staffId =", session.staffId);

  try {
    const supabase = createSupabaseAdminClient();

    // 対象スタッフの存在確認
    const { data: targetStaff, error: fetchError } = await supabase
      .from("staff")
      .select("id, login_id, display_name")
      .eq("id", targetStaffId)
      .single();

    if (fetchError || !targetStaff) {
      return NextResponse.json(
        { error: "スタッフが見つかりません。" },
        { status: 404 }
      );
    }

    // 仮パスワードをハッシュ化
    const newHash = await bcrypt.hash(TEMPORARY_PASSWORD, SALT_ROUNDS);

    // パスワードを更新
    const { error: updateError } = await supabase
      .from("staff")
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetStaffId);

    if (updateError) {
      console.error("❌ パスワード更新エラー:", updateError);
      return NextResponse.json(
        { error: "パスワードの更新に失敗しました。" },
        { status: 500 }
      );
    }

    console.log(`✅ スタッフ "${targetStaff.login_id}" のパスワードを仮パスワード "${TEMPORARY_PASSWORD}" にリセットしました`);

    return NextResponse.json({
      success: true,
      message: `${targetStaff.display_name || targetStaff.login_id} のパスワードを仮パスワード "${TEMPORARY_PASSWORD}" にリセットしました。`,
      temporaryPassword: TEMPORARY_PASSWORD,
    });
  } catch (err) {
    console.error("❌ パスワードリセットエラー:", err);
    return NextResponse.json(
      { error: "エラーが発生しました。" },
      { status: 500 }
    );
  }
}
