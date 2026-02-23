import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = Promise<{ family_id: string }>;

/**
 * POST /api/families/[family_id]/members
 * 家族にメンバーを追加
 * 注: 管理ダッシュボード用のため、RLSをバイパスする管理者用クライアントを使用
 *
 * Request Body:
 * {
 *   user_id: string  // 追加するユーザーのID
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const { family_id } = await params;
  const supabase = createSupabaseAdminClient();

  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id は必須です" },
        { status: 400 }
      );
    }

    // 追加するユーザーの現在の家族情報を取得
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, display_name, family_id")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const oldFamilyId = user.family_id;

    // 追加先の家族が存在するか確認
    const { data: targetFamily, error: familyError } = await supabase
      .from("families")
      .select("id, family_name")
      .eq("id", family_id)
      .single();

    if (familyError || !targetFamily) {
      return NextResponse.json(
        { error: "追加先の家族が見つかりません" },
        { status: 404 }
      );
    }

    // 既に同じ家族に所属している場合
    if (oldFamilyId === family_id) {
      return NextResponse.json(
        { error: "このユーザーは既にこの家族に所属しています" },
        { status: 400 }
      );
    }

    // ユーザーを新しい家族に移動
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        family_id: family_id,
        family_role: "child", // 追加されたメンバーは子ども
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("ユーザー更新エラー:", updateError);
      return NextResponse.json(
        { error: "ユーザーの家族への追加に失敗しました" },
        { status: 500 }
      );
    }

    // 旧家族のメンバー数を確認
    if (oldFamilyId) {
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("family_id", oldFamilyId);

      if (countError) {
        console.error("旧家族のメンバー数確認エラー:", countError);
      } else if (count === 0) {
        // メンバーが0人になった旧家族を削除
        const { error: deleteError } = await supabase
          .from("families")
          .delete()
          .eq("id", oldFamilyId);

        if (deleteError) {
          console.error("旧家族の削除エラー:", deleteError);
        }
      }
    }

    await logActivityIfStaff(request, "family_member_add", {
      targetType: "family",
      targetId: family_id,
      details: { user_id },
    });

    return NextResponse.json({
      success: true,
      message: `${user.display_name || user_id} を ${targetFamily.family_name} に追加しました`,
    });
  } catch (error) {
    console.error("メンバー追加処理エラー:", error);
    return NextResponse.json(
      { error: "メンバーの追加に失敗しました" },
      { status: 500 }
    );
  }
}
