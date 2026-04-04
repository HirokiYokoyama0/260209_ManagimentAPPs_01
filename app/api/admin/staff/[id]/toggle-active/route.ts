import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";

/**
 * PATCH /api/admin/staff/[id]/toggle-active
 * スタッフアカウントの有効/無効を切り替える
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    // 現在のスタッフ情報を取得
    const { data: currentStaff, error: fetchError } = await supabase
      .from("staff")
      .select("id, login_id, is_active")
      .eq("id", id)
      .single();

    if (fetchError || !currentStaff) {
      return NextResponse.json(
        { error: "スタッフが見つかりません" },
        { status: 404 }
      );
    }

    // is_activeを反転
    const newIsActive = !currentStaff.is_active;

    const { data, error } = await supabase
      .from("staff")
      .update({ is_active: newIsActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling staff active status:", error);
      return NextResponse.json(
        { error: "ステータスの更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      staff: data,
      message: newIsActive
        ? `${currentStaff.login_id} を有効化しました`
        : `${currentStaff.login_id} を無効化しました`,
    });
  } catch (err) {
    console.error("toggle-active API error:", err);
    return NextResponse.json(
      { error: "ステータスの更新に失敗しました" },
      { status: 500 }
    );
  }
}
