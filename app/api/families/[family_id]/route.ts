import { logActivityIfStaff } from "@/lib/activity-log";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { NextRequest, NextResponse } from "next/server";
import type { Family, Profile, FamilyWithMembers } from "@/lib/types";

type RouteParams = Promise<{ family_id: string }>;

/**
 * GET /api/families/[family_id]
 * 家族詳細を取得（メンバー情報付き）
 * 注: 管理ダッシュボード用のため、RLSをバイパスする管理者用クライアントを使用
 */
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const { family_id } = await params;
  const supabase = createSupabaseAdminClient();

  // 家族情報を取得
  const { data: family, error: familyError } = await supabase
    .from("families")
    .select("*")
    .eq("id", family_id)
    .single();

  if (familyError || !family) {
    return NextResponse.json(
      { error: "家族が見つかりません" },
      { status: 404 }
    );
  }

  // 家族のメンバーを取得
  const { data: members, error: membersError } = await supabase
    .from("profiles")
    .select("*")
    .eq("family_id", family_id)
    .order("family_role", { ascending: false }); // parent が先

  if (membersError) {
    console.error("メンバー情報取得エラー:", membersError);
    return NextResponse.json(
      { error: "メンバー情報の取得に失敗しました" },
      { status: 500 }
    );
  }

  // 家族の合計情報を計算
  const total_stamp_count = members?.reduce((sum, m) => sum + (m.stamp_count || 0), 0) || 0;
  const total_visit_count = members?.reduce((sum, m) => sum + (m.visit_count || 0), 0) || 0;
  const member_count = members?.length || 0;

  const result: FamilyWithMembers = {
    ...(family as Family),
    members: (members || []) as Profile[],
    total_stamp_count,
    total_visit_count,
    member_count,
  };

  return NextResponse.json(result);
}

/**
 * PATCH /api/families/[family_id]
 * 家族情報を更新（家族名の変更など）
 * 注: 管理ダッシュボード用のため、RLSをバイパスする管理者用クライアントを使用
 *
 * Request Body:
 * {
 *   family_name?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const { family_id } = await params;
  const supabase = createSupabaseAdminClient();

  try {
    const body = await request.json();
    const { family_name } = body;

    if (!family_name) {
      return NextResponse.json(
        { error: "family_name は必須です" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("families")
      .update({
        family_name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", family_id)
      .select()
      .single();

    if (error) {
      console.error("家族更新エラー:", error);
      return NextResponse.json(
        { error: "家族情報の更新に失敗しました" },
        { status: 500 }
      );
    }

    await logActivityIfStaff(request, "family_update", {
      targetType: "family",
      targetId: family_id,
    });

    return NextResponse.json(data as Family);
  } catch (error) {
    console.error("家族更新処理エラー:", error);
    return NextResponse.json(
      { error: "家族情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/families/[family_id]
 * 家族を解除（全メンバーを単身家族に戻す）
 * 注: 管理ダッシュボード用のため、RLSをバイパスする管理者用クライアントを使用
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  const { family_id } = await params;
  const supabase = createSupabaseAdminClient();

  try {
    // 家族のメンバーを取得
    const { data: members, error: membersError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("family_id", family_id);

    if (membersError) {
      console.error("メンバー情報取得エラー:", membersError);
      return NextResponse.json(
        { error: "メンバー情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json(
        { error: "家族にメンバーが存在しません" },
        { status: 400 }
      );
    }

    // 各メンバーに新しい単身家族を作成
    for (const member of members) {
      // 単身家族を作成
      const { data: newFamily, error: familyError } = await supabase
        .from("families")
        .insert({
          family_name: `${member.display_name || "ユーザー"}の家族`,
          representative_user_id: member.id,
        })
        .select()
        .single();

      if (familyError) {
        console.error(`メンバー ${member.id} の単身家族作成エラー:`, familyError);
        continue;
      }

      // profilesテーブルを更新
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          family_id: newFamily.id,
          family_role: "parent",
        })
        .eq("id", member.id);

      if (updateError) {
        console.error(`メンバー ${member.id} の更新エラー:`, updateError);
      }
    }

    // 旧家族を削除
    const { error: deleteError } = await supabase
      .from("families")
      .delete()
      .eq("id", family_id);

    if (deleteError) {
      console.error("家族削除エラー:", deleteError);
      return NextResponse.json(
        { error: "家族の削除に失敗しました" },
        { status: 500 }
      );
    }

    await logActivityIfStaff(request, "family_delete", {
      targetType: "family",
      targetId: family_id,
    });

    return NextResponse.json({ success: true, message: "家族を解除しました" });
  } catch (error) {
    console.error("家族削除処理エラー:", error);
    return NextResponse.json(
      { error: "家族の削除に失敗しました" },
      { status: 500 }
    );
  }
}
