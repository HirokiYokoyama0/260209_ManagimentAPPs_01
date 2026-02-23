import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = Promise<{ family_id: string; user_id: string }>;

/**
 * DELETE /api/families/[family_id]/members/[user_id]
 * 家族からメンバーを削除（分家・独立）
 * 注: 管理ダッシュボード用のため、RLSをバイパスする管理者用クライアントを使用
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const { family_id, user_id } = await params;
  const supabase = createSupabaseAdminClient();

  try {
    // 削除対象のユーザー情報を取得
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, display_name, family_id, family_role")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 指定された家族に所属しているか確認
    if (user.family_id !== family_id) {
      return NextResponse.json(
        { error: "このユーザーは指定された家族に所属していません" },
        { status: 400 }
      );
    }

    // 家族のメンバー数を確認
    const { count: memberCount, error: countError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("family_id", family_id);

    if (countError) {
      console.error("メンバー数確認エラー:", countError);
      return NextResponse.json(
        { error: "メンバー数の確認に失敗しました" },
        { status: 500 }
      );
    }

    // 既に単身者の場合はエラー
    if (memberCount === 1) {
      return NextResponse.json(
        { error: "この操作は不要です。既に単身者です。" },
        { status: 400 }
      );
    }

    // 保護者の場合は削除できない（先に別のメンバーを保護者に変更する必要がある）
    if (user.family_role === "parent") {
      return NextResponse.json(
        { error: "保護者は家族から削除できません。先に別のメンバーを保護者に変更してください。" },
        { status: 400 }
      );
    }

    // 新しい単身家族を作成
    const { data: newFamily, error: familyError } = await supabase
      .from("families")
      .insert({
        family_name: `${user.display_name || "ユーザー"}の家族`,
        representative_user_id: user_id,
      })
      .select()
      .single();

    if (familyError) {
      console.error("単身家族作成エラー:", familyError);
      return NextResponse.json(
        { error: "単身家族の作成に失敗しました" },
        { status: 500 }
      );
    }

    // ユーザーを新しい家族に移動
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        family_id: newFamily.id,
        family_role: "parent",
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("ユーザー更新エラー:", updateError);
      return NextResponse.json(
        { error: "ユーザーの独立処理に失敗しました" },
        { status: 500 }
      );
    }

    await logActivityIfStaff(request, "family_member_remove", {
      targetType: "family",
      targetId: family_id,
      details: { user_id },
    });

    return NextResponse.json({
      success: true,
      message: `${user.display_name || user_id} を独立させました`,
      new_family_id: newFamily.id,
    });
  } catch (error) {
    console.error("メンバー削除処理エラー:", error);
    return NextResponse.json(
      { error: "メンバーの削除に失敗しました" },
      { status: 500 }
    );
  }
}
