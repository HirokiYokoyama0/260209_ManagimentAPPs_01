import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

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

  // Note: このAPIは管理画面（/admin/*）からのみアクセス可能。
  // middleware.ts で /admin/* へのアクセスは認証済みユーザーのみに制限されているため、
  // この API 内での追加の認証チェックは不要。

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
